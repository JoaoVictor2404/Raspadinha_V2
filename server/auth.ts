// Blueprint: javascript_auth_all_persistance
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { validateCPF, validateEmail } from "./security-helpers";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        const user = await storage.getUserByEmail(email);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      }
    ),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    const { email, password, name, phone, birthDate, cpf, referralCode } = req.body;
    
    console.log("[AUTH] Registration request:", {  
      email,
      name,
      hasPassword: !!password,
      referralCode: referralCode || 'none'
    });

    // Validate required fields
    if (!email || !password || !name || !phone || !birthDate || !cpf) {
      return res.status(400).send("Todos os campos são obrigatórios");
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).send("Email inválido");
    }

    // Validate CPF format
    if (!validateCPF(cpf)) {
      return res.status(400).send("CPF inválido");
    }

    // Validate birth date format and age (18+)
    const birthDateObj = new Date(birthDate);
    
    // Check if date is valid
    if (isNaN(birthDateObj.getTime())) {
      return res.status(400).send("Data de nascimento inválida");
    }
    
    const today = new Date();
    const age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    const dayDiff = today.getDate() - birthDateObj.getDate();
    
    if (age < 18 || (age === 18 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)))) {
      return res.status(400).send("Você precisa ter 18 anos ou mais para se cadastrar");
    }

    // Check if email already exists
    const existingEmail = await storage.getUserByEmail(email);
    if (existingEmail) {
      return res.status(400).send("Email já cadastrado");
    }

    // Check if CPF already exists
    const existingCPF = await storage.getUserByCPF(cpf);
    if (existingCPF) {
      return res.status(400).send("CPF já cadastrado");
    }

    // Generate username from email
    const username = email.split('@')[0] + '_' + randomBytes(4).toString('hex');

    const user = await storage.createUser({
      username,
      email,
      name,
      phone,
      birthDate: birthDateObj,
      cpf,
      password: await hashPassword(password),
    });
    console.log("[AUTH] User created:", user.id, user.email);

    // Process referral if referralCode provided
    if (referralCode) {
      console.log("[AUTH] Processing referral code:", referralCode);
      try {
        const { createReferralOnRegistration } = await import("./affiliates-tracking");
        await createReferralOnRegistration(user.id, referralCode);
        console.log("[AUTH] Referral created successfully");
      } catch (error) {
        console.error("[AUTH] Error creating referral:", error);
        // Don't fail registration if referral creation fails
      }
    } else {
      console.log("[AUTH] No referral code provided");
    }

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
