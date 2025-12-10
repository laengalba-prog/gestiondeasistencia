import { type User, type InsertUser, type Class, type InsertClass, type Booking, type InsertBooking } from "@shared/schema";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User | null>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<User | undefined>;
  validateStudentEmail(email: string): Promise<boolean>;
  
  // Class methods
  getClass(id: string): Promise<Class | undefined>;
  getAllClasses(): Promise<Class[]>;
  getClassesByDateRange(startDate: Date, endDate: Date): Promise<Class[]>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(classId: string, updates: Partial<InsertClass>): Promise<Class | undefined>;
  updateClassEnrollment(classId: string, enrolled: number): Promise<Class | undefined>;
  deleteClass(classId: string): Promise<boolean>;
  
  // Booking methods
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingsByUser(userId: string): Promise<Booking[]>;
  getBookingsByClass(classId: string, statusFilter?: "active" | "cancelled" | "recovery" | null): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking | null>;
  updateBookingStatus(bookingId: string, status: "active" | "cancelled" | "recovery"): Promise<Booking | undefined>;
  cancelBooking(bookingId: string): Promise<Booking | undefined>;
  
  // Holiday methods
  addHoliday(date: string): Promise<void>;
  removeHoliday(date: string): Promise<void>;
  getHolidays(): Promise<string[]>;
  
  // Load from Supabase
  loadStudentsFromSupabase(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private classes: Map<string, Class>;
  private bookings: Map<string, Booking>;
  private holidays: Set<string> = new Set();
  private supabase: any;
  private supabaseStudents: Set<string> = new Set();

  constructor() {
    this.users = new Map();
    this.classes = new Map();
    this.bookings = new Map();
    
    // Initialize Supabase if credentials available
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
    
    this.seedData();
    this.initializeHolidaysFromMadrid();
  }

  private initializeHolidaysFromMadrid() {
    // Add Madrid 2025-2026 holidays automatically
    // Only adds if not already present, preserves user-added holidays
    const madridHolidays = [
      // 2025 holidays
      "2025-01-01", // Año Nuevo
      "2025-01-06", // Reyes
      "2025-04-18", // Viernes Santo
      "2025-05-01", // Día del Trabajo
      "2025-05-15", // San Isidro Labrador (Madrid)
      "2025-05-22", // Día de la Universidad (Alcalá de Henares)
      "2025-10-12", // Día Nacional de España
      "2025-10-23", // Día de Cervantes (Alcalá de Henares)
      "2025-11-01", // Todos los Santos
      "2025-12-06", // Día de la Constitución
      "2025-12-08", // Inmaculada Concepción
      "2025-12-24", // Cierre - Nochebuena
      "2025-12-25", // Navidad
      "2025-12-26", // Cierre
      "2025-12-27", // Cierre
      "2025-12-28", // Cierre
      "2025-12-29", // Cierre
      "2025-12-30", // Cierre
      "2025-12-31", // Cierre - Nochevieja
      // 2026 holidays
      "2026-01-01", // Año Nuevo
      "2026-01-02", // Cierre
      "2026-01-03", // Cierre
      "2026-01-04", // Cierre
      "2026-01-06", // Reyes
      "2026-04-02", // Jueves Santo
      "2026-04-03", // Viernes Santo
      "2026-05-01", // Día del Trabajo
      "2026-05-15", // San Isidro Labrador (Madrid)
      "2026-05-22", // Día de la Universidad (Alcalá de Henares)
      "2026-10-12", // Día Nacional de España
      "2026-10-23", // Día de Cervantes (Alcalá de Henares)
      "2026-11-01", // Todos los Santos
      "2026-12-06", // Día de la Constitución
      "2026-12-08", // Inmaculada Concepción
      "2026-12-24", // Cierre - Nochebuena
      "2026-12-25", // Navidad
      "2026-12-26", // Cierre
      "2026-12-27", // Cierre
      "2026-12-28", // Cierre
      "2026-12-29", // Cierre
      "2026-12-30", // Cierre
      "2026-12-31", // Cierre - Nochevieja
    ];

    for (const holiday of madridHolidays) {
      // Only add if not already present (preserves user-added dates)
      if (!this.holidays.has(holiday)) {
        this.holidays.add(holiday);
      }
    }
  }

  private async seedData() {
    // Create test users with password "password123"
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    const adminId = randomUUID();
    this.users.set(adminId, {
      id: adminId,
      name: "Admin User",
      email: "admin@laengalba.com",
      password: hashedPassword,
      role: "admin",
    });

    // Create test student (will be overwritten by Supabase data)
    const studentId = randomUUID();
    this.users.set(studentId, {
      id: studentId,
      name: "Test Student",
      email: "test@laengalba.com",
      password: hashedPassword,
      role: "student",
    });

    // Create classes from Sept 2025 to June 2026
    const startDate = new Date("2025-09-01");
    const endDate = new Date("2026-06-30");
    
    // Define class schedule: { dayOfWeek, hours: [array of start hours] }
    // Hours represent the START time: 10=10-12, 12=12-14, 17=17-19, 19=19-21
    // dayOfWeek: 1=Monday, 2=Tuesday, ..., 5=Friday, 6=Saturday, 0=Sunday
    const schedule = [
      { dayOfWeek: 1, hours: [19] },          // Monday: 19-21
      { dayOfWeek: 2, hours: [17, 19] },      // Tuesday: 17-19, 19-21
      { dayOfWeek: 3, hours: [12, 17, 19] },  // Wednesday: 12-14, 17-19, 19-21
      { dayOfWeek: 4, hours: [19] },          // Thursday: 19-21
      { dayOfWeek: 5, hours: [10, 12, 19] },  // Friday: 10-12, 12-14, 19-21
    ];
    
    // Generate classes for the period
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // Check if this day is a holiday
      const dateStr = currentDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const isHoliday = this.holidays.has(dateStr);
      
      if (!isHoliday) {
        const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay(); // Convert: 0->7, 1->1, etc
        
        // Find schedule for this day
        const daySchedule = schedule.find(s => s.dayOfWeek === dayOfWeek);
        if (daySchedule) {
          // Create classes for each hour in the schedule
          for (const hour of daySchedule.hours) {
            // Torno class (7 spots)
            const tornoClass = new Date(currentDate);
            tornoClass.setUTCHours(hour, 0, 0, 0);
            
            const tornoId = randomUUID();
            this.classes.set(tornoId, {
              id: tornoId,
              type: "torno",
              startTime: tornoClass,
              capacity: 7,
              enrolled: 0,
            });

            // Modelado class (3 spots)
            const modeladoClass = new Date(currentDate);
            modeladoClass.setUTCHours(hour, 0, 0, 0);
            
            const modeladoId = randomUUID();
            this.classes.set(modeladoId, {
              id: modeladoId,
              type: "modelado",
              startTime: modeladoClass,
              capacity: 3,
              enrolled: 0,
            });
          }
        }
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`Seeded ${this.users.size} users and ${this.classes.size} classes`);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User | null> {
    // Enforce unique email constraint
    const existing = await this.getUserByEmail(insertUser.email);
    if (existing) {
      return null; // Email already exists
    }
    
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "student"
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updated: User = { ...user, password: hashedPassword };
    this.users.set(userId, updated);
    return updated;
  }

  async deleteUser(userId: string): Promise<boolean> {
    return this.users.delete(userId);
  }

  // Class methods
  async getClass(id: string): Promise<Class | undefined> {
    return this.classes.get(id);
  }

  async getAllClasses(): Promise<Class[]> {
    return Array.from(this.classes.values());
  }

  async getClassesByDateRange(startDate: Date, endDate: Date): Promise<Class[]> {
    return Array.from(this.classes.values()).filter(
      (cls) => cls.startTime >= startDate && cls.startTime <= endDate
    );
  }

  async createClass(insertClass: InsertClass): Promise<Class> {
    const id = randomUUID();
    const classData: Class = {
      ...insertClass,
      id,
      enrolled: 0,
    };
    this.classes.set(id, classData);
    return classData;
  }

  async updateClass(classId: string, updates: Partial<InsertClass>): Promise<Class | undefined> {
    const classData = this.classes.get(classId);
    if (!classData) return undefined;
    
    const updated: Class = { ...classData, ...updates };
    this.classes.set(classId, updated);
    return updated;
  }

  async updateClassEnrollment(classId: string, enrolled: number): Promise<Class | undefined> {
    const classData = this.classes.get(classId);
    if (!classData) return undefined;
    
    const updated: Class = { ...classData, enrolled };
    this.classes.set(classId, updated);
    return updated;
  }

  async deleteClass(classId: string): Promise<boolean> {
    return this.classes.delete(classId);
  }

  // Booking methods
  async getBooking(id: string): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getBookingsByUser(userId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      (booking) => booking.userId === userId
    );
  }

  async getBookingsByClass(classId: string, statusFilter?: "active" | "cancelled" | "recovery" | null): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      (booking) => {
        if (booking.classId !== classId) return false;
        if (statusFilter === null || statusFilter === undefined) return true;
        return booking.status === statusFilter;
      }
    );
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking | null> {
    const status = insertBooking.status || "active";
    
    // Prevent duplicate active bookings for the same user/class
    if (status === "active") {
      const existingBookings = await this.getBookingsByUser(insertBooking.userId);
      const hasDuplicate = existingBookings.some(
        b => b.classId === insertBooking.classId && b.status === "active"
      );
      
      if (hasDuplicate) {
        return null; // Duplicate active booking exists
      }
    }
    
    const id = randomUUID();
    const booking: Booking = {
      ...insertBooking,
      id,
      status,
      bookedAt: new Date(),
      cancelledAt: null,
    };
    this.bookings.set(id, booking);
    
    // Automatically increment enrollment if booking is active
    if (status === "active") {
      const classData = await this.getClass(insertBooking.classId);
      if (classData) {
        await this.updateClassEnrollment(insertBooking.classId, classData.enrolled + 1);
      }
    }
    
    return booking;
  }

  async updateBookingStatus(bookingId: string, status: "active" | "cancelled" | "recovery"): Promise<Booking | undefined> {
    const booking = this.bookings.get(bookingId);
    if (!booking) return undefined;
    
    const oldStatus = booking.status;
    const updated: Booking = {
      ...booking,
      status,
      cancelledAt: status === "cancelled" ? new Date() : booking.cancelledAt,
    };
    this.bookings.set(bookingId, updated);
    
    // Automatically adjust class enrollment when booking status changes
    if (oldStatus !== status) {
      const classData = await this.getClass(booking.classId);
      if (classData) {
        let enrollmentDelta = 0;
        
        // Calculate enrollment change
        if (oldStatus === "active" && status !== "active") {
          enrollmentDelta = -1; // Moving from active to cancelled/recovery
        } else if (oldStatus !== "active" && status === "active") {
          enrollmentDelta = 1; // Moving to active from cancelled/recovery
        }
        
        if (enrollmentDelta !== 0) {
          const newEnrollment = Math.max(0, Math.min(classData.capacity, classData.enrolled + enrollmentDelta));
          await this.updateClassEnrollment(booking.classId, newEnrollment);
        }
      }
    }
    
    return updated;
  }

  async cancelBooking(bookingId: string): Promise<Booking | undefined> {
    return this.updateBookingStatus(bookingId, "cancelled");
  }

  // Holiday methods
  async addHoliday(date: string): Promise<void> {
    this.holidays.add(date);
  }

  async removeHoliday(date: string): Promise<void> {
    this.holidays.delete(date);
  }

  async getHolidays(): Promise<string[]> {
    return Array.from(this.holidays);
  }

  async validateStudentEmail(email: string): Promise<boolean> {
    // Check if email is in the set of valid students from Supabase
    return this.supabaseStudents.has(email.toLowerCase());
  }

  async loadStudentsFromSupabase(): Promise<void> {
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
      
      // Fetch students from Supabase (horarios_asistencia table)
      // Select only text columns to avoid serialization issues
      const { data: horariosData, error: horariosError } = await this.supabase
        .from("horarios_asistencia")
        .select("id, \"nombre alumno\", día, hora, \"tipo de clase\"");

      if (horariosError) {
        console.error("[Supabase] Error loading horarios from Supabase (will use manual load later):", JSON.stringify(horariosError, null, 2));
        return;
      }

      if (!horariosData || horariosData.length === 0) {
        console.log("[Supabase] No horarios found - use /api/admin/load-supabase endpoint to load data");
        return;
      }

      console.log(`[Supabase] Query successful. Horarios found: ${horariosData?.length || 0}`);

      // Fetch students from alumnos table with emails and phones
      const { data: alumnosData, error: alumnosError } = await this.supabase
        .from("alumnos")
        .select("\"nombre alumno\", email, telefono");

      if (alumnosError) {
        console.error("[Supabase] Error loading alumnos from Supabase:", JSON.stringify(alumnosError, null, 2));
        return;
      }

      // Create a map of student names to their email for quick lookup
      // Key: lowercase name, Value: { email, nombreOriginal }
      const alumnosArray = (alumnosData || []).filter((a: any) => a["nombre alumno"] && a["email"]).map((a: any) => ({
        nombre: a["nombre alumno"].trim(),
        nombreLower: a["nombre alumno"].trim().toLowerCase(),
        email: a["email"].trim().toLowerCase()
      }));
      console.log(`[Supabase] Loaded ${alumnosArray.length} students from alumnos table`);
      
      // Log all student emails for debugging
      console.log("[Supabase] Student emails loaded:");
      for (const alumno of alumnosArray) {
        console.log(`  - ${alumno.nombre} → ${alumno.email}`);
      }

      // Function to find email by name with strict matching
      const findStudentEmail = (nameToFind: string): string | undefined => {
        const nameLower = nameToFind.toLowerCase().trim().replace(/\s+/g, " ");
        
        // Try exact match first
        for (const alumno of alumnosArray) {
          if (alumno.nombreLower === nameLower) {
            return alumno.email;
          }
        }
        
        // Try matching all significant words (length > 2) from search name
        const searchWords = nameLower.split(/\s+/).filter(w => w.length > 2);
        if (searchWords.length > 0) {
          for (const alumno of alumnosArray) {
            const alumnoWords = alumno.nombreLower.split(/\s+/);
            
            // Check if ALL search words appear in alumno name (as complete words, not substrings)
            const allWordsMatch = searchWords.every((searchWord: string) =>
              alumnoWords.some((alumnoWord: string) => alumnoWord === searchWord)
            );
            
            if (allWordsMatch) {
              return alumno.email;
            }
          }
        }
        
        // Fall back to at least 2 matching significant words
        if (searchWords.length >= 2) {
          for (const alumno of alumnosArray) {
            const alumnoWords = alumno.nombreLower.split(/\s+/);
            
            // Count how many search words match as complete words
            let matchCount = 0;
            for (const searchWord of searchWords) {
              if (alumnoWords.some((aw: string) => aw === searchWord)) {
                matchCount++;
              }
            }
            
            // If we matched at least 2 words and they're not too common
            if (matchCount >= 2) {
              return alumno.email;
            }
          }
        }
        
        return undefined;
      };

      // Create users and bookings from Supabase data
      const bcrypt = await import("bcryptjs");
      const defaultPassword = await bcrypt.hash("laengalba2024", 10);

      let bookingCounter = 0;
      for (const row of horariosData) {
        const studentNameRaw = row["nombre alumno"]?.trim();
        const studentEmail = findStudentEmail(studentNameRaw || "");
        const dayName = row["día"]?.trim().toLowerCase();
        const horaStr = row["hora"]?.trim();
        const classType = row["tipo de clase"]?.trim().toLowerCase();

        if (!studentNameRaw || !dayName || !studentEmail) {
          if (studentNameRaw && !studentEmail) {
            console.log(`[Supabase] Warning: No email found for student "${studentNameRaw}"`);
          }
          continue;
        }

        // Parse hour if provided
        let targetHour: number | null = null;
        if (horaStr) {
          // Handle both "12:00:00" and "12:00" formats
          const hourMatch = horaStr.match(/^(\d{1,2}):/);
          if (hourMatch) {
            targetHour = parseInt(hourMatch[1]);
          }
        }
        
        console.log(`[Supabase] Processing: ${studentNameRaw} (${studentEmail}) - ${dayName} ${horaStr} (type: ${classType})`);


        // Add to valid students set
        this.supabaseStudents.add(studentEmail);

        // Check if user already exists
        let user = await this.getUserByEmail(studentEmail);

        if (!user) {
          // Create new user
          const newUser: InsertUser = {
            name: studentNameRaw,
            email: studentEmail,
            password: defaultPassword,
            role: "student",
          };
          user = await this.createUser(newUser) as User | undefined;
          if (!user) continue;
        }

        // Map day names to numbers (1=Monday, 5=Friday)
        // Split by "y" to support "lunes y miércoles" format
        const dayParts = dayName.split(" y ").map((d: string) => d.trim());
        const dayMap: { [key: string]: number } = {
          "lunes": 1,
          "martes": 2,
          "miércoles": 3,
          "miercoles": 3,
          "jueves": 4,
          "viernes": 5,
          "rotativo": 0, // Special case: all days
        };

        const days: number[] = [];
        for (const dayPart of dayParts) {
          if (dayMap[dayPart] !== undefined) {
            if (dayMap[dayPart] === 0) {
              // Rotativo: add all weekdays
              days.push(1, 2, 3, 4, 5);
            } else {
              days.push(dayMap[dayPart]);
            }
          }
        }

        // Find or create bookings for these days
        for (const dayNum of days) {
          // Find classes for this day
          // If classType is specified (torno/modelado), only match that type
          // If hour is specified, only match that hour
          // Otherwise match all hours for all types
          const matchingClasses = Array.from(this.classes.values()).filter((cls) => {
            const classDate = new Date(cls.startTime);
            const classDay = classDate.getUTCDay() === 0 ? 7 : classDate.getUTCDay();
            
            if (classDay !== dayNum) return false;
            
            // If class type is specified, MUST match that type
            if (classType) {
              if (cls.type !== classType) return false;
            }
            
            // If hour is specified, MUST match that hour
            if (targetHour !== null) {
              if (classDate.getUTCHours() !== targetHour) return false;
            }
            
            return true;
          });

          console.log(`[Supabase] Found ${matchingClasses.length} matching classes for ${studentNameRaw} on day ${dayNum}`);

          for (const cls of matchingClasses) {
            // Create booking if not already exists
            const existingBooking = Array.from(this.bookings.values()).find(
              (b) => b.userId === user!.id && b.classId === cls.id && b.status === "active"
            );

            if (!existingBooking && cls.enrolled < cls.capacity) {
              const booking: Booking = {
                id: randomUUID(),
                userId: user.id,
                classId: cls.id,
                status: "active",
                bookedAt: new Date(),
                cancelledAt: null,
              };
              this.bookings.set(booking.id, booking);
              await this.updateClassEnrollment(cls.id, cls.enrolled + 1);
              bookingCounter++;
              console.log(`[Supabase] Created booking #${bookingCounter} for ${studentNameRaw} in class ${cls.type} (hour: ${new Date(cls.startTime).getHours()})`);
            }
          }
        }
      }

      // Log summary of class enrollment by type
      const enrollmentSummary: Record<string, Record<string, number>> = {};
      for (const cls of Array.from(this.classes.values())) {
        const classDate = new Date(cls.startTime);
        const dayName = ["dom", "lun", "mar", "mié", "jue", "vie", "sab"][classDate.getUTCDay()];
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
}

export const storage = new MemStorage();
storage.loadStudentsFromSupabase().catch(console.error);
