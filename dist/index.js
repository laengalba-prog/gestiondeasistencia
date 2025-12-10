var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/storage.ts
var storage_exports = {};
__export(storage_exports, {
  MemStorage: () => MemStorage,
  storage: () => storage
});
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
var MemStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    MemStorage = class {
      users;
      classes;
      bookings;
      holidays = /* @__PURE__ */ new Set();
      supabase;
      supabaseStudents = /* @__PURE__ */ new Set();
      constructor() {
        this.users = /* @__PURE__ */ new Map();
        this.classes = /* @__PURE__ */ new Map();
        this.bookings = /* @__PURE__ */ new Map();
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseKey) {
          this.supabase = createClient(supabaseUrl, supabaseKey);
        }
        this.seedData();
        this.initializeHolidaysFromMadrid();
      }
      initializeHolidaysFromMadrid() {
        const madridHolidays = [
          // 2025 holidays
          "2025-01-01",
          // Año Nuevo
          "2025-01-06",
          // Reyes
          "2025-04-18",
          // Viernes Santo
          "2025-05-01",
          // Día del Trabajo
          "2025-05-15",
          // San Isidro Labrador (Madrid)
          "2025-05-22",
          // Día de la Universidad (Alcalá de Henares)
          "2025-10-12",
          // Día Nacional de España
          "2025-10-23",
          // Día de Cervantes (Alcalá de Henares)
          "2025-11-01",
          // Todos los Santos
          "2025-12-06",
          // Día de la Constitución
          "2025-12-08",
          // Inmaculada Concepción
          "2025-12-24",
          // Cierre - Nochebuena
          "2025-12-25",
          // Navidad
          "2025-12-26",
          // Cierre
          "2025-12-27",
          // Cierre
          "2025-12-28",
          // Cierre
          "2025-12-29",
          // Cierre
          "2025-12-30",
          // Cierre
          "2025-12-31",
          // Cierre - Nochevieja
          // 2026 holidays
          "2026-01-01",
          // Año Nuevo
          "2026-01-02",
          // Cierre
          "2026-01-03",
          // Cierre
          "2026-01-04",
          // Cierre
          "2026-01-06",
          // Reyes
          "2026-04-02",
          // Jueves Santo
          "2026-04-03",
          // Viernes Santo
          "2026-05-01",
          // Día del Trabajo
          "2026-05-15",
          // San Isidro Labrador (Madrid)
          "2026-05-22",
          // Día de la Universidad (Alcalá de Henares)
          "2026-10-12",
          // Día Nacional de España
          "2026-10-23",
          // Día de Cervantes (Alcalá de Henares)
          "2026-11-01",
          // Todos los Santos
          "2026-12-06",
          // Día de la Constitución
          "2026-12-08",
          // Inmaculada Concepción
          "2026-12-24",
          // Cierre - Nochebuena
          "2026-12-25",
          // Navidad
          "2026-12-26",
          // Cierre
          "2026-12-27",
          // Cierre
          "2026-12-28",
          // Cierre
          "2026-12-29",
          // Cierre
          "2026-12-30",
          // Cierre
          "2026-12-31"
          // Cierre - Nochevieja
        ];
        for (const holiday of madridHolidays) {
          if (!this.holidays.has(holiday)) {
            this.holidays.add(holiday);
          }
        }
      }
      async seedData() {
        const bcrypt2 = await import("bcryptjs");
        const hashedPassword = await bcrypt2.hash("password123", 10);
        const adminId = randomUUID();
        this.users.set(adminId, {
          id: adminId,
          name: "Admin User",
          email: "admin@laengalba.com",
          password: hashedPassword,
          role: "admin"
        });
        const studentId = randomUUID();
        this.users.set(studentId, {
          id: studentId,
          name: "Test Student",
          email: "test@laengalba.com",
          password: hashedPassword,
          role: "student"
        });
        const startDate = /* @__PURE__ */ new Date("2025-09-01");
        const endDate = /* @__PURE__ */ new Date("2026-06-30");
        const schedule = [
          { dayOfWeek: 1, hours: [19] },
          // Monday: 19-21
          { dayOfWeek: 2, hours: [17, 19] },
          // Tuesday: 17-19, 19-21
          { dayOfWeek: 3, hours: [12, 17, 19] },
          // Wednesday: 12-14, 17-19, 19-21
          { dayOfWeek: 4, hours: [19] },
          // Thursday: 19-21
          { dayOfWeek: 5, hours: [10, 12, 19] }
          // Friday: 10-12, 12-14, 19-21
        ];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const dateStr = currentDate.toISOString().split("T")[0];
          const isHoliday = this.holidays.has(dateStr);
          if (!isHoliday) {
            const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay();
            const daySchedule = schedule.find((s) => s.dayOfWeek === dayOfWeek);
            if (daySchedule) {
              for (const hour of daySchedule.hours) {
                const tornoClass = new Date(currentDate);
                tornoClass.setUTCHours(hour, 0, 0, 0);
                const tornoId = randomUUID();
                this.classes.set(tornoId, {
                  id: tornoId,
                  type: "torno",
                  startTime: tornoClass,
                  capacity: 7,
                  enrolled: 0
                });
                const modeladoClass = new Date(currentDate);
                modeladoClass.setUTCHours(hour, 0, 0, 0);
                const modeladoId = randomUUID();
                this.classes.set(modeladoId, {
                  id: modeladoId,
                  type: "modelado",
                  startTime: modeladoClass,
                  capacity: 3,
                  enrolled: 0
                });
              }
            }
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
        console.log(`Seeded ${this.users.size} users and ${this.classes.size} classes`);
      }
      // User methods
      async getUser(id) {
        return this.users.get(id);
      }
      async getUserByEmail(email) {
        return Array.from(this.users.values()).find(
          (user) => user.email === email
        );
      }
      async createUser(insertUser) {
        const existing = await this.getUserByEmail(insertUser.email);
        if (existing) {
          return null;
        }
        const id = randomUUID();
        const user = {
          ...insertUser,
          id,
          role: insertUser.role || "student"
        };
        this.users.set(id, user);
        return user;
      }
      async updateUserPassword(userId, hashedPassword) {
        const user = this.users.get(userId);
        if (!user) return void 0;
        const updated = { ...user, password: hashedPassword };
        this.users.set(userId, updated);
        return updated;
      }
      async deleteUser(userId) {
        return this.users.delete(userId);
      }
      // Class methods
      async getClass(id) {
        return this.classes.get(id);
      }
      async getAllClasses() {
        return Array.from(this.classes.values());
      }
      async getClassesByDateRange(startDate, endDate) {
        return Array.from(this.classes.values()).filter(
          (cls) => cls.startTime >= startDate && cls.startTime <= endDate
        );
      }
      async createClass(insertClass) {
        const id = randomUUID();
        const classData = {
          ...insertClass,
          id,
          enrolled: 0
        };
        this.classes.set(id, classData);
        return classData;
      }
      async updateClass(classId, updates) {
        const classData = this.classes.get(classId);
        if (!classData) return void 0;
        const updated = { ...classData, ...updates };
        this.classes.set(classId, updated);
        return updated;
      }
      async updateClassEnrollment(classId, enrolled) {
        const classData = this.classes.get(classId);
        if (!classData) return void 0;
        const updated = { ...classData, enrolled };
        this.classes.set(classId, updated);
        return updated;
      }
      async deleteClass(classId) {
        return this.classes.delete(classId);
      }
      // Booking methods
      async getBooking(id) {
        return this.bookings.get(id);
      }
      async getBookingsByUser(userId) {
        return Array.from(this.bookings.values()).filter(
          (booking) => booking.userId === userId
        );
      }
      async getBookingsByClass(classId, statusFilter) {
        return Array.from(this.bookings.values()).filter(
          (booking) => {
            if (booking.classId !== classId) return false;
            if (statusFilter === null || statusFilter === void 0) return true;
            return booking.status === statusFilter;
          }
        );
      }
      async createBooking(insertBooking) {
        const status = insertBooking.status || "active";
        if (status === "active") {
          const existingBookings = await this.getBookingsByUser(insertBooking.userId);
          const hasDuplicate = existingBookings.some(
            (b) => b.classId === insertBooking.classId && b.status === "active"
          );
          if (hasDuplicate) {
            return null;
          }
        }
        const id = randomUUID();
        const booking = {
          ...insertBooking,
          id,
          status,
          bookedAt: /* @__PURE__ */ new Date(),
          cancelledAt: null
        };
        this.bookings.set(id, booking);
        if (status === "active") {
          const classData = await this.getClass(insertBooking.classId);
          if (classData) {
            await this.updateClassEnrollment(insertBooking.classId, classData.enrolled + 1);
          }
        }
        return booking;
      }
      async updateBookingStatus(bookingId, status) {
        const booking = this.bookings.get(bookingId);
        if (!booking) return void 0;
        const oldStatus = booking.status;
        const updated = {
          ...booking,
          status,
          cancelledAt: status === "cancelled" ? /* @__PURE__ */ new Date() : booking.cancelledAt
        };
        this.bookings.set(bookingId, updated);
        if (oldStatus !== status) {
          const classData = await this.getClass(booking.classId);
          if (classData) {
            let enrollmentDelta = 0;
            if (oldStatus === "active" && status !== "active") {
              enrollmentDelta = -1;
            } else if (oldStatus !== "active" && status === "active") {
              enrollmentDelta = 1;
            }
            if (enrollmentDelta !== 0) {
              const newEnrollment = Math.max(0, Math.min(classData.capacity, classData.enrolled + enrollmentDelta));
              await this.updateClassEnrollment(booking.classId, newEnrollment);
            }
          }
        }
        return updated;
      }
      async cancelBooking(bookingId) {
        return this.updateBookingStatus(bookingId, "cancelled");
      }
      // Holiday methods
      async addHoliday(date) {
        this.holidays.add(date);
      }
      async removeHoliday(date) {
        this.holidays.delete(date);
      }
      async getHolidays() {
        return Array.from(this.holidays);
      }
      async validateStudentEmail(email) {
        return this.supabaseStudents.has(email.toLowerCase());
      }
      async loadStudentsFromSupabase() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;
        console.log(`[Supabase] URL configured: ${!!supabaseUrl}`);
        console.log(`[Supabase] Key configured: ${!!supabaseKey}`);
        if (!this.supabase) {
          console.log("[Supabase] Client not initialized - credentials missing");
          return;
        }
        try {
          console.log("[Supabase] Attempting to load students from horarios_asistencia table...");
          const { data: horariosData, error: horariosError } = await this.supabase.from("horarios_asistencia").select('id, "nombre alumno", d\xEDa, hora, "tipo de clase"');
          if (horariosError) {
            console.error("[Supabase] Error loading horarios from Supabase (will use manual load later):", JSON.stringify(horariosError, null, 2));
            return;
          }
          if (!horariosData || horariosData.length === 0) {
            console.log("[Supabase] No horarios found - use /api/admin/load-supabase endpoint to load data");
            return;
          }
          console.log(`[Supabase] Query successful. Horarios found: ${horariosData?.length || 0}`);
          const { data: alumnosData, error: alumnosError } = await this.supabase.from("alumnos").select('"nombre alumno", email, telefono');
          if (alumnosError) {
            console.error("[Supabase] Error loading alumnos from Supabase:", JSON.stringify(alumnosError, null, 2));
            return;
          }
          const alumnosArray = (alumnosData || []).filter((a) => a["nombre alumno"] && a["email"]).map((a) => ({
            nombre: a["nombre alumno"].trim(),
            nombreLower: a["nombre alumno"].trim().toLowerCase(),
            email: a["email"].trim().toLowerCase()
          }));
          console.log(`[Supabase] Loaded ${alumnosArray.length} students from alumnos table`);
          console.log("[Supabase] Student emails loaded:");
          for (const alumno of alumnosArray) {
            console.log(`  - ${alumno.nombre} \u2192 ${alumno.email}`);
          }
          const findStudentEmail = (nameToFind) => {
            const nameLower = nameToFind.toLowerCase().trim().replace(/\s+/g, " ");
            for (const alumno of alumnosArray) {
              if (alumno.nombreLower === nameLower) {
                return alumno.email;
              }
            }
            const searchWords = nameLower.split(/\s+/).filter((w) => w.length > 2);
            if (searchWords.length > 0) {
              for (const alumno of alumnosArray) {
                const alumnoWords = alumno.nombreLower.split(/\s+/);
                const allWordsMatch = searchWords.every(
                  (searchWord) => alumnoWords.some((alumnoWord) => alumnoWord === searchWord)
                );
                if (allWordsMatch) {
                  return alumno.email;
                }
              }
            }
            if (searchWords.length >= 2) {
              for (const alumno of alumnosArray) {
                const alumnoWords = alumno.nombreLower.split(/\s+/);
                let matchCount = 0;
                for (const searchWord of searchWords) {
                  if (alumnoWords.some((aw) => aw === searchWord)) {
                    matchCount++;
                  }
                }
                if (matchCount >= 2) {
                  return alumno.email;
                }
              }
            }
            return void 0;
          };
          const bcrypt2 = await import("bcryptjs");
          const defaultPassword = await bcrypt2.hash("laengalba2024", 10);
          let bookingCounter = 0;
          for (const row of horariosData) {
            const studentNameRaw = row["nombre alumno"]?.trim();
            const studentEmail = findStudentEmail(studentNameRaw || "");
            const dayName = row["d\xEDa"]?.trim().toLowerCase();
            const horaStr = row["hora"]?.trim();
            const classType = row["tipo de clase"]?.trim().toLowerCase();
            if (!studentNameRaw || !dayName || !studentEmail) {
              if (studentNameRaw && !studentEmail) {
                console.log(`[Supabase] Warning: No email found for student "${studentNameRaw}"`);
              }
              continue;
            }
            let targetHour = null;
            if (horaStr) {
              const hourMatch = horaStr.match(/^(\d{1,2}):/);
              if (hourMatch) {
                targetHour = parseInt(hourMatch[1]);
              }
            }
            console.log(`[Supabase] Processing: ${studentNameRaw} (${studentEmail}) - ${dayName} ${horaStr} (type: ${classType})`);
            this.supabaseStudents.add(studentEmail);
            let user = await this.getUserByEmail(studentEmail);
            if (!user) {
              const newUser = {
                name: studentNameRaw,
                email: studentEmail,
                password: defaultPassword,
                role: "student"
              };
              user = await this.createUser(newUser);
              if (!user) continue;
            }
            const dayParts = dayName.split(" y ").map((d) => d.trim());
            const dayMap = {
              "lunes": 1,
              "martes": 2,
              "mi\xE9rcoles": 3,
              "miercoles": 3,
              "jueves": 4,
              "viernes": 5,
              "rotativo": 0
              // Special case: all days
            };
            const days = [];
            for (const dayPart of dayParts) {
              if (dayMap[dayPart] !== void 0) {
                if (dayMap[dayPart] === 0) {
                  days.push(1, 2, 3, 4, 5);
                } else {
                  days.push(dayMap[dayPart]);
                }
              }
            }
            for (const dayNum of days) {
              const matchingClasses = Array.from(this.classes.values()).filter((cls) => {
                const classDate = new Date(cls.startTime);
                const classDay = classDate.getUTCDay() === 0 ? 7 : classDate.getUTCDay();
                if (classDay !== dayNum) return false;
                if (classType) {
                  if (cls.type !== classType) return false;
                }
                if (targetHour !== null) {
                  if (classDate.getUTCHours() !== targetHour) return false;
                }
                return true;
              });
              console.log(`[Supabase] Found ${matchingClasses.length} matching classes for ${studentNameRaw} on day ${dayNum}`);
              for (const cls of matchingClasses) {
                const existingBooking = Array.from(this.bookings.values()).find(
                  (b) => b.userId === user.id && b.classId === cls.id && b.status === "active"
                );
                if (!existingBooking && cls.enrolled < cls.capacity) {
                  const booking = {
                    id: randomUUID(),
                    userId: user.id,
                    classId: cls.id,
                    status: "active",
                    bookedAt: /* @__PURE__ */ new Date(),
                    cancelledAt: null
                  };
                  this.bookings.set(booking.id, booking);
                  await this.updateClassEnrollment(cls.id, cls.enrolled + 1);
                  bookingCounter++;
                  console.log(`[Supabase] Created booking #${bookingCounter} for ${studentNameRaw} in class ${cls.type} (hour: ${new Date(cls.startTime).getHours()})`);
                }
              }
            }
          }
          const enrollmentSummary = {};
          for (const cls of Array.from(this.classes.values())) {
            const classDate = new Date(cls.startTime);
            const dayName = ["dom", "lun", "mar", "mi\xE9", "jue", "vie", "sab"][classDate.getUTCDay()];
            const hour = classDate.getUTCHours();
            const key = `${dayName} ${hour}:00 ${cls.type}`;
            if (!enrollmentSummary[key]) enrollmentSummary[key] = { total: 0, count: 0 };
            enrollmentSummary[key].total += cls.enrolled;
            enrollmentSummary[key].count += 1;
          }
          console.log("[Supabase] Class enrollment summary:");
          for (const [key, value] of Object.entries(enrollmentSummary)) {
            if (value.count > 0) {
              const avgEnrolled = (value.total / value.count).toFixed(1);
              console.log(`  ${key}: ${avgEnrolled} enrolled (avg across ${value.count} classes)`);
            }
          }
          console.log(`[Supabase] Successfully loaded ${horariosData.length} students from Supabase`);
        } catch (err) {
          console.error("[Supabase] Exception while loading students:", err);
        }
      }
    };
    storage = new MemStorage();
    storage.loadStudentsFromSupabase().catch(console.error);
  }
});

// server/index-prod.ts
import fs from "node:fs";
import path from "node:path";
import express2 from "express";

// server/app.ts
import express from "express";
import session from "express-session";
import MemoryStore from "memorystore";

// server/routes.ts
init_storage();
import { createServer } from "http";

// server/auth.ts
init_storage();
import bcrypt from "bcryptjs";
var SALT_ROUNDS = 10;
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}
async function registerUser(userData) {
  const hashedPassword = await hashPassword(userData.password);
  return storage.createUser({
    ...userData,
    password: hashedPassword
  });
}
async function authenticateUser(email, password) {
  const user = await storage.getUserByEmail(email);
  if (!user) return null;
  const isValid = await comparePassword(password, user.password);
  if (!isValid) return null;
  return user;
}
function sanitizeUser(user) {
  const { password, ...sanitized } = user;
  return sanitized;
}

// server/types.ts
import "express-session";

// server/middleware.ts
async function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Autenticaci\xF3n requerida" });
  }
  next();
}
async function requireAdmin(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Autenticaci\xF3n requerida" });
  }
  const { storage: storage2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
  const user = await storage2.getUser(req.session.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Acceso denegado: solo administradores" });
  }
  req.session.userRole = user.role;
  next();
}
async function attachUser(req, res, next) {
  if (req.session?.userId && req.session.userName && req.session.userEmail && req.session.userRole) {
    req.user = {
      id: req.session.userId,
      name: req.session.userName,
      email: req.session.userEmail,
      role: req.session.userRole
    };
  }
  next();
}

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("student")
  // 'student' or 'admin'
});
var classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  // 'torno' or 'modelado'
  startTime: timestamp("start_time").notNull(),
  capacity: integer("capacity").notNull(),
  // 7 for torno, 3 for modelado
  enrolled: integer("enrolled").notNull().default(0)
});
var bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  classId: varchar("class_id").notNull().references(() => classes.id),
  status: text("status").notNull().default("active"),
  // 'active', 'cancelled', 'recovery'
  bookedAt: timestamp("booked_at").notNull().default(sql`now()`),
  cancelledAt: timestamp("cancelled_at")
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true
});
var insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  enrolled: true
});
var insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  bookedAt: true,
  cancelledAt: true
});

// server/routes.ts
import { z } from "zod";
async function registerRoutes(app2) {
  app2.use(attachUser);
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const isValidStudent = await storage.validateStudentEmail(userData.email);
      if (!isValidStudent) {
        return res.status(403).json({ error: "No tienes acceso. Por favor, verifica tu correo electr\xF3nico." });
      }
      const user = await registerUser(userData);
      if (!user) {
        return res.status(409).json({ error: "El correo electr\xF3nico ya est\xE1 registrado" });
      }
      req.session.userId = user.id;
      req.session.userName = user.name;
      req.session.userEmail = user.email;
      req.session.userRole = user.role;
      res.json({ user: sanitizeUser(user) });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inv\xE1lidos", details: error.errors });
      }
      res.status(500).json({ error: "Error al registrar usuario" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email y contrase\xF1a son requeridos" });
      }
      const user = await authenticateUser(email, password);
      if (!user) {
        return res.status(401).json({ error: "Credenciales inv\xE1lidas" });
      }
      req.session.userId = user.id;
      req.session.userName = user.name;
      req.session.userEmail = user.email;
      req.session.userRole = user.role;
      res.json({ user: sanitizeUser(user) });
    } catch (error) {
      res.status(500).json({ error: "Error al iniciar sesi\xF3n" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Error al cerrar sesi\xF3n" });
      }
      res.json({ message: "Sesi\xF3n cerrada correctamente" });
    });
  });
  app2.post("/api/auth/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ error: "Todos los campos son requeridos" });
      }
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: "Las contrase\xF1as no coinciden" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "La contrase\xF1a debe tener al menos 6 caracteres" });
      }
      if (!req.session.userId) {
        return res.status(401).json({ error: "No autenticado" });
      }
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "Usuario no encontrado" });
      }
      const isValidPassword = await comparePassword(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Contrase\xF1a actual incorrecta" });
      }
      const hashedPassword = await hashPassword(newPassword);
      const updatedUser = await storage.updateUserPassword(req.session.userId, hashedPassword);
      if (!updatedUser) {
        return res.status(500).json({ error: "Error al cambiar la contrase\xF1a" });
      }
      res.json({ message: "Contrase\xF1a cambida correctamente" });
    } catch (error) {
      res.status(500).json({ error: "Error al cambiar la contrase\xF1a" });
    }
  });
  app2.get("/api/auth/me", requireAuth, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "No autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }
    req.session.userRole = user.role;
    req.session.userName = user.name;
    req.session.userEmail = user.email;
    res.json({ user: sanitizeUser(user) });
  });
  app2.get("/api/classes", async (req, res) => {
    try {
      const classes2 = await storage.getAllClasses();
      res.json({ classes: classes2 });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener clases" });
    }
  });
  app2.get("/api/classes/range", async (req, res) => {
    try {
      const { start, end } = req.query;
      if (!start || !end) {
        return res.status(400).json({ error: "Fechas de inicio y fin son requeridas" });
      }
      const startDate = new Date(start);
      const endDate = new Date(end);
      const classes2 = await storage.getClassesByDateRange(startDate, endDate);
      res.json({ classes: classes2 });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener clases" });
    }
  });
  app2.post("/api/classes", requireAdmin, async (req, res) => {
    try {
      const classData = insertClassSchema.parse(req.body);
      const newClass = await storage.createClass(classData);
      res.json({ class: newClass });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inv\xE1lidos", details: error.errors });
      }
      res.status(500).json({ error: "Error al crear clase" });
    }
  });
  app2.patch("/api/classes/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedClass = await storage.updateClass(id, updates);
      if (!updatedClass) {
        return res.status(404).json({ error: "Clase no encontrada" });
      }
      res.json({ class: updatedClass });
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar clase" });
    }
  });
  app2.delete("/api/classes/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteClass(id);
      if (!deleted) {
        return res.status(404).json({ error: "Clase no encontrada" });
      }
      res.json({ message: "Clase eliminada correctamente" });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar clase" });
    }
  });
  app2.post("/api/admin/load-supabase", requireAdmin, async (req, res) => {
    try {
      console.log("[Admin] Loading Supabase data...");
      await storage.loadStudentsFromSupabase();
      res.json({ message: "Datos cargados correctamente desde Supabase" });
    } catch (error) {
      console.error("[Admin] Error loading Supabase:", error);
      res.status(500).json({ error: "Error al cargar datos de Supabase" });
    }
  });
  app2.get("/api/bookings/user", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }
      const bookings2 = await storage.getBookingsByUser(req.user.id);
      res.json(bookings2);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener reservas" });
    }
  });
  app2.get("/api/bookings/class/:classId", async (req, res) => {
    try {
      const { classId } = req.params;
      const { status } = req.query;
      const bookings2 = await storage.getBookingsByClass(
        classId,
        status
      );
      const enrichedBookings = await Promise.all(
        bookings2.map(async (booking) => {
          const user = await storage.getUser(booking.userId);
          return {
            ...booking,
            userName: user?.name || "Usuario desconocido",
            userEmail: user?.email || ""
          };
        })
      );
      res.json({ bookings: enrichedBookings });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener reservas de la clase" });
    }
  });
  app2.post("/api/bookings", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      const classData = await storage.getClass(bookingData.classId);
      if (!classData) {
        return res.status(404).json({ error: "Clase no encontrada" });
      }
      const holidays = await storage.getHolidays();
      const classDate = new Date(classData.startTime);
      const classDateStr = classDate.toISOString().split("T")[0];
      if (holidays.includes(classDateStr)) {
        return res.status(400).json({ error: "No se puede reservar una clase en d\xEDa festivo" });
      }
      const now = /* @__PURE__ */ new Date();
      const classStartTime = new Date(classData.startTime);
      const minutesUntilClass = (classStartTime.getTime() - now.getTime()) / (1e3 * 60);
      if (minutesUntilClass < 30) {
        return res.status(400).json({
          error: "No se puede reservar con menos de 30 minutos de antelaci\xF3n"
        });
      }
      if (classData.enrolled >= classData.capacity) {
        return res.status(400).json({ error: "Clase llena" });
      }
      const booking = await storage.createBooking(bookingData);
      if (!booking) {
        return res.status(409).json({ error: "Ya tienes una reserva activa para esta clase" });
      }
      res.json({ booking });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inv\xE1lidos", details: error.errors });
      }
      res.status(500).json({ error: "Error al crear reserva" });
    }
  });
  app2.post("/api/bookings/:id/cancel", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }
      const { id } = req.params;
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ error: "Reserva no encontrada" });
      }
      if (booking.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "No autorizado" });
      }
      if (req.user.role !== "admin") {
        const classData = await storage.getClass(booking.classId);
        if (classData) {
          const now = /* @__PURE__ */ new Date();
          const classStartTime = new Date(classData.startTime);
          const hoursUntilClass = (classStartTime.getTime() - now.getTime()) / (1e3 * 60 * 60);
          if (hoursUntilClass < 2) {
            return res.status(400).json({
              error: "No se puede cancelar con menos de 2 horas de antelaci\xF3n"
            });
          }
        }
      }
      const cancelled = await storage.cancelBooking(id);
      if (!cancelled) {
        return res.status(500).json({ error: "Error al cancelar reserva" });
      }
      res.json({ booking: cancelled });
    } catch (error) {
      res.status(500).json({ error: "Error al cancelar reserva" });
    }
  });
  app2.patch("/api/bookings/:id/status", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!["active", "cancelled", "recovery"].includes(status)) {
        return res.status(400).json({ error: "Estado inv\xE1lido" });
      }
      const updated = await storage.updateBookingStatus(id, status);
      if (!updated) {
        return res.status(404).json({ error: "Reserva no encontrada" });
      }
      res.json({ booking: updated });
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar estado de reserva" });
    }
  });
  app2.get("/api/debug/supabase-test", async (req, res) => {
    try {
      const results = {
        tests: {}
      };
      const supabaseClient = storage.supabase;
      results.tests.supabaseInitialized = !!supabaseClient;
      try {
        const { count, error: countError } = await supabaseClient.from("horarios_asistencia").select("id", { count: "exact", head: true });
        results.tests.rowCount = {
          count,
          error: countError ? JSON.stringify(countError) : null
        };
      } catch (e) {
        results.tests.rowCount = { error: JSON.stringify(e) };
      }
      try {
        const { data, error } = await supabaseClient.from("horarios_asistencia").select("id");
        results.tests.fetchId = {
          success: !error,
          rowsReturned: data?.length || 0,
          error: error ? JSON.stringify(error) : null
        };
      } catch (e) {
        results.tests.fetchId = { error: JSON.stringify(e) };
      }
      try {
        const { data, error } = await supabaseClient.from("horarios_asistencia").select("nombre alumno");
        results.tests.fetchNombre = {
          success: !error,
          rowsReturned: data?.length || 0,
          error: error ? JSON.stringify(error) : null,
          sample: data?.[0]
        };
      } catch (e) {
        results.tests.fetchNombre = { error: JSON.stringify(e) };
      }
      try {
        const { data, error } = await supabaseClient.from("horarios_asistencia").select("*");
        results.tests.fetchAll = {
          success: !error,
          rowsReturned: data?.length || 0,
          error: error ? JSON.stringify(error) : null,
          sample: data?.[0]
        };
      } catch (e) {
        results.tests.fetchAll = { error: JSON.stringify(e) };
      }
      try {
        const response = await fetch(
          `${process.env.SUPABASE_URL}/rest/v1/horarios_asistencia?select=id&limit=1`,
          {
            headers: {
              "apikey": process.env.SUPABASE_ANON_KEY || "",
              "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY || ""}`
            }
          }
        );
        const body = await response.text();
        results.tests.rawRest = {
          status: response.status,
          statusText: response.statusText,
          body: body.substring(0, 500)
        };
      } catch (e) {
        results.tests.rawRest = { error: String(e) };
      }
      try {
        const { data, error, count } = await supabaseClient.from("alumnos").select("*", { count: "exact" });
        results.tests.alumnosTable = {
          success: !error,
          count,
          rowsReturned: data?.length || 0,
          error: error ? JSON.stringify(error) : null
        };
      } catch (e) {
        results.tests.alumnosTable = { error: JSON.stringify(e) };
      }
      try {
        const { data, error } = await supabaseClient.from("information_schema.tables").select("table_name, table_schema").eq("table_schema", "public");
        results.tests.tableListing = {
          success: !error,
          tables: data?.map((t) => t.table_name) || [],
          error: error ? JSON.stringify(error) : null
        };
      } catch (e) {
        results.tests.tableListing = { error: JSON.stringify(e) };
      }
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Debug test failed", details: String(error) });
    }
  });
  app2.get("/api/debug/compare-supabase", async (req, res) => {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: "Supabase credentials not configured" });
      }
      const { createClient: createClient2 } = await import("@supabase/supabase-js");
      const supabase = createClient2(supabaseUrl, supabaseKey);
      const { data: horarios, error: horError } = await supabase.from("horarios_asistencia").select("*");
      const { data: alumnos, error: alumError } = await supabase.from("alumnos").select("*");
      if (horError || alumError) {
        return res.status(500).json({
          error: "Failed to fetch Supabase data",
          details: horError || alumError
        });
      }
      const alumnosMap = new Map(
        alumnos.map((a) => {
          const nombre = a.nombre?.toLowerCase().trim();
          return [nombre, a];
        })
      );
      const missingData = [];
      const duplicateNames = {};
      const withMultipleSchedules = {};
      horarios.forEach((h) => {
        const studentName = Object.keys(h).find(
          (key) => key.toLowerCase().includes("nombre") && key.toLowerCase().includes("alumno")
        );
        const normName = h[studentName]?.toLowerCase().trim();
        duplicateNames[normName] = (duplicateNames[normName] || 0) + 1;
      });
      horarios.forEach((h) => {
        const studentNameKey = Object.keys(h).find(
          (key) => key.toLowerCase().includes("nombre") && key.toLowerCase().includes("alumno")
        );
        const horaKey = Object.keys(h).find((key) => key.toLowerCase() === "hora");
        const diaKey = Object.keys(h).find((key) => key.toLowerCase() === "d\xEDa");
        const typeKey = Object.keys(h).find(
          (key) => key.toLowerCase().includes("tipo") && key.toLowerCase().includes("clase")
        );
        const normName = h[studentNameKey]?.toLowerCase().trim();
        const alumData = alumnosMap.get(normName);
        if (duplicateNames[normName] > 1) {
          if (!withMultipleSchedules[h[studentNameKey]]) {
            withMultipleSchedules[h[studentNameKey]] = [];
          }
          withMultipleSchedules[h[studentNameKey]].push({
            d\u00EDa: h[diaKey],
            hora: h[horaKey],
            tipo: h[typeKey]
          });
        }
        if (!alumData || !alumData.email) {
          missingData.push({
            nombre: h[studentNameKey],
            d\u00EDa: h[diaKey],
            hora: h[horaKey],
            tipo: h[typeKey],
            email: alumData?.email || "MISSING"
          });
        }
      });
      res.json({
        totalHorarios: horarios.length,
        totalAlumnos: alumnos.length,
        missingData,
        withMultipleSchedules,
        allAlumnos: alumnos,
        horariosSample: horarios.slice(0, 2)
      });
    } catch (error) {
      res.status(500).json({ error: "Error comparing Supabase data", details: String(error) });
    }
  });
  app2.get("/api/admin/debug-loaded-students", requireAdmin, async (req, res) => {
    try {
      const allUsers = Array.from(storage.users?.values?.() || []);
      const allBookings = Array.from(storage.bookings?.values?.() || []);
      const students = allUsers.filter((u) => u.role === "student");
      const studentData = students.map((student) => {
        const bookingCount = allBookings.filter((b) => b.userId === student.id && b.status === "active").length;
        return {
          id: student.id,
          name: student.name,
          email: student.email,
          bookingCount
        };
      });
      studentData.sort((a, b) => a.bookingCount - b.bookingCount);
      res.json({
        totalStudents: students.length,
        totalBookings: allBookings.filter((b) => b.status === "active").length,
        students: studentData,
        search: req.query.q ? studentData.filter((s) => s.name.toLowerCase().includes(req.query.q.toLowerCase())) : []
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
  app2.get("/api/admin/debug-supabase-students", requireAdmin, async (req, res) => {
    try {
      const supabaseClient = storage.supabase;
      const { data: horariosData, error: horariosError } = await supabaseClient.from("horarios_asistencia").select('"nombre alumno", d\xEDa, hora, "tipo de clase"');
      if (horariosError) {
        return res.status(500).json({ error: JSON.stringify(horariosError) });
      }
      const { data: alumnosData, error: alumnosError } = await supabaseClient.from("alumnos").select('"nombre alumno", email');
      if (alumnosError) {
        return res.status(500).json({ error: JSON.stringify(alumnosError) });
      }
      const alumnosArray = (alumnosData || []).map((a) => ({
        nombre: a["nombre alumno"].trim(),
        nombreLower: a["nombre alumno"].trim().toLowerCase(),
        email: a["email"].trim().toLowerCase()
      }));
      const notMatched = [];
      const matched = [];
      for (const row of horariosData) {
        const studentNameRaw = row["nombre alumno"]?.trim();
        const nameLower = studentNameRaw?.toLowerCase().trim().replace(/\s+/g, " ");
        let found = false;
        for (const alumno of alumnosArray) {
          if (alumno.nombreLower === nameLower || alumno.nombreLower.includes(nameLower) || nameLower.includes(alumno.nombreLower)) {
            found = true;
            matched.push({
              fromHorarios: studentNameRaw,
              matchedEmail: alumno.email,
              dia: row["d\xEDa"],
              tipo: row["tipo de clase"]
            });
            break;
          }
        }
        if (!found) {
          notMatched.push({
            nombre: studentNameRaw,
            dia: row["d\xEDa"],
            tipo: row["tipo de clase"]
          });
        }
      }
      res.json({
        totalHorarios: horariosData.length,
        totalAlumnos: alumnosArray.length,
        matched: matched.length,
        notMatched: notMatched.length,
        notMatchedList: notMatched,
        sampleMatched: matched.slice(0, 5)
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
  app2.get("/api/admin/class-distribution", requireAdmin, async (req, res) => {
    try {
      const storageAny = storage;
      const bookingsArray = Array.from(storageAny.bookings?.values?.() || []);
      const classesArray = Array.from(storageAny.classes?.values?.() || []);
      const holidays = await storage.getHolidays();
      const holidaySet = new Set(holidays);
      const classMap = {};
      const teachingDatesSet = /* @__PURE__ */ new Set();
      for (const cls of classesArray) {
        const clsData = cls;
        classMap[clsData.id] = clsData;
        const classDate = new Date(clsData.startTime);
        const dateKey = `${classDate.getUTCFullYear()}-${String(classDate.getUTCMonth() + 1).padStart(2, "0")}-${String(classDate.getUTCDate()).padStart(2, "0")}`;
        if (!holidaySet.has(dateKey)) {
          teachingDatesSet.add(dateKey);
        }
      }
      const groupClasses = {};
      for (const booking of bookingsArray) {
        const b = booking;
        if (b.status !== "active") continue;
        const classData = classMap[b.classId];
        if (!classData) continue;
        const classStartTime = new Date(classData.startTime);
        const dayName = classStartTime.toLocaleDateString("es-ES", { weekday: "long" }).split(",")[0];
        const timeStr = classStartTime.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false });
        const groupName = `${dayName} ${timeStr}`;
        const dayOfWeek = classStartTime.getUTCDay();
        if (!groupClasses[groupName]) {
          groupClasses[groupName] = {
            groupName,
            studentCount: 0,
            dayOfWeek
          };
        }
        groupClasses[groupName].studentCount += 1;
      }
      const distribution = Object.values(groupClasses).map((group) => {
        const holidaysInGroup = holidays.filter((holiday) => {
          const holidayDate = new Date(holiday);
          return holidayDate.getUTCDay() === group.dayOfWeek;
        }).length;
        return {
          groupName: group.groupName,
          studentCount: group.studentCount,
          holidaysCount: holidaysInGroup
        };
      }).sort((a, b) => {
        const dayOrder = {
          "lunes": 1,
          "martes": 2,
          "mi\xE9rcoles": 3,
          "jueves": 4,
          "viernes": 5,
          "s\xE1bado": 6,
          "domingo": 0
        };
        const [dayA, timeA] = a.groupName.split(" ");
        const [dayB, timeB] = b.groupName.split(" ");
        const dayDiffA = dayOrder[dayA] || 0;
        const dayDiffB = dayOrder[dayB] || 0;
        const dayDiff = dayDiffA - dayDiffB;
        if (dayDiff !== 0) return dayDiff;
        return timeA.localeCompare(timeB);
      });
      const studentCounts = distribution.map((d) => d.studentCount);
      const avgStudents = studentCounts.length > 0 ? studentCounts.reduce((a, b) => a + b, 0) / studentCounts.length : 0;
      const teachingDays = teachingDatesSet.size;
      const holidaysCount = holidays.length;
      res.json({
        distribution,
        stats: {
          totalGroups: distribution.length,
          avgStudents: avgStudents.toFixed(2),
          teachingDays,
          holidays: holidaysCount
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener distribuci\xF3n de clases" });
    }
  });
  app2.get("/api/admin/class-count-period", requireAdmin, async (req, res) => {
    try {
      const storageAny = storage;
      const classesArray = Array.from(storageAny.classes?.values?.() || []);
      const holidays = await storage.getHolidays();
      const holidaySet = new Set(holidays);
      const startDate = /* @__PURE__ */ new Date("2025-09-01");
      const endDate = /* @__PURE__ */ new Date("2026-06-30");
      const groupClasses = {};
      for (const cls of classesArray) {
        const clsData = cls;
        const classDate = new Date(clsData.startTime);
        if (classDate < startDate || classDate > endDate) continue;
        const dateKey = `${classDate.getUTCFullYear()}-${String(classDate.getUTCMonth() + 1).padStart(2, "0")}-${String(classDate.getUTCDate()).padStart(2, "0")}`;
        if (holidaySet.has(dateKey)) continue;
        const dayName = classDate.toLocaleDateString("es-ES", { weekday: "long" }).split(",")[0];
        const timeStr = classDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false });
        const groupName = `${dayName} ${timeStr}`;
        const dayOfWeek = classDate.getUTCDay();
        if (!groupClasses[groupName]) {
          groupClasses[groupName] = {
            groupName,
            classCount: 0,
            dayOfWeek,
            dates: /* @__PURE__ */ new Set()
          };
        }
        groupClasses[groupName].classCount += 1;
        groupClasses[groupName].dates.add(dateKey);
      }
      const distribution = Object.values(groupClasses).map((group) => ({
        groupName: group.groupName,
        classCount: group.classCount,
        dates: Array.from(group.dates).length
      })).sort((a, b) => {
        const dayOrder = {
          "lunes": 1,
          "martes": 2,
          "mi\xE9rcoles": 3,
          "jueves": 4,
          "viernes": 5,
          "s\xE1bado": 6,
          "domingo": 0
        };
        const [dayA, timeA] = a.groupName.split(" ");
        const [dayB, timeB] = b.groupName.split(" ");
        const dayDiffA = dayOrder[dayA] || 0;
        const dayDiffB = dayOrder[dayB] || 0;
        const dayDiff = dayDiffA - dayDiffB;
        if (dayDiff !== 0) return dayDiff;
        return timeA.localeCompare(timeB);
      });
      res.json({
        distribution,
        period: {
          start: "2025-09-01",
          end: "2026-06-30"
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener conteo de clases" });
    }
  });
  app2.get("/api/admin/holidays", requireAdmin, async (req, res) => {
    try {
      const holidays = await storage.getHolidays();
      res.json({ holidays });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener d\xEDas festivos" });
    }
  });
  app2.post("/api/admin/holidays", requireAdmin, async (req, res) => {
    try {
      const { date } = req.body;
      if (!date) {
        return res.status(400).json({ error: "Date is required" });
      }
      await storage.addHoliday(date);
      res.json({ message: "Holiday added" });
    } catch (error) {
      res.status(500).json({ error: "Error al a\xF1adir d\xEDa festivo" });
    }
  });
  app2.delete("/api/admin/holidays/:date", requireAdmin, async (req, res) => {
    try {
      const { date } = req.params;
      await storage.removeHoliday(date);
      res.json({ message: "Holiday removed" });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar d\xEDa festivo" });
    }
  });
  app2.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const storageAny = storage;
      const users2 = Array.from(storageAny.users?.values?.() || []);
      const students = users2.filter((u) => u.role === "student");
      res.json({ users: students });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener estudiantes" });
    }
  });
  app2.delete("/api/admin/users/:userId", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const userBookings = await storage.getBookingsByUser(userId);
      for (const booking of userBookings) {
        if (booking.status === "active") {
          await storage.updateBookingStatus(booking.id, "cancelled");
        }
      }
      const deleted = await storage.deleteUser(userId);
      if (!deleted) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      res.json({ message: "Usuario eliminado correctamente" });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar usuario" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/app.ts
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
var app = express();
var MemStore = MemoryStore(session);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "la-engalba-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: new MemStore({
      checkPeriod: 864e5
      // prune expired entries every 24h
    }),
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1e3,
      // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    }
  })
);
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path2 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path2.startsWith("/api")) {
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
async function runApp(setup) {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  await setup(app, server);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
}

// server/index-prod.ts
async function serveStatic(app2, _server) {
  const distPath = path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
(async () => {
  await runApp(serveStatic);
})();
export {
  serveStatic
};
