import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerUser, authenticateUser, sanitizeUser, hashPassword, comparePassword } from "./auth";
import { requireAuth, requireAdmin, attachUser, type AuthRequest } from "./middleware";
import { insertUserSchema, insertClassSchema, insertBookingSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Attach user to all requests
  app.use(attachUser);

  // ============ AUTH ROUTES ============
  
  // Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Validate that the email exists in Supabase
      const isValidStudent = await storage.validateStudentEmail(userData.email);
      if (!isValidStudent) {
        return res.status(403).json({ error: "No tienes acceso. Por favor, verifica tu correo electrónico." });
      }
      
      const user = await registerUser(userData);
      
      // Storage layer enforces unique email - null means email already exists
      if (!user) {
        return res.status(409).json({ error: "El correo electrónico ya está registrado" });
      }
      
      // Auto-login after registration
      req.session.userId = user.id;
      req.session.userName = user.name;
      req.session.userEmail = user.email;
      req.session.userRole = user.role;
      
      res.json({ user: sanitizeUser(user) });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error al registrar usuario" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email y contraseña son requeridos" });
      }

      const user = await authenticateUser(email, password);
      
      if (!user) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      req.session.userId = user.id;
      req.session.userName = user.name;
      req.session.userEmail = user.email;
      req.session.userRole = user.role;

      res.json({ user: sanitizeUser(user) });
    } catch (error) {
      res.status(500).json({ error: "Error al iniciar sesión" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Error al cerrar sesión" });
      }
      res.json({ message: "Sesión cerrada correctamente" });
    });
  });

  // Change password
  app.post("/api/auth/change-password", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ error: "Todos los campos son requeridos" });
      }
      
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: "Las contraseñas no coinciden" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
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
        return res.status(401).json({ error: "Contraseña actual incorrecta" });
      }

      const hashedPassword = await hashPassword(newPassword);
      const updatedUser = await storage.updateUserPassword(req.session.userId, hashedPassword);

      if (!updatedUser) {
        return res.status(500).json({ error: "Error al cambiar la contraseña" });
      }

      res.json({ message: "Contraseña cambida correctamente" });
    } catch (error) {
      res.status(500).json({ error: "Error al cambiar la contraseña" });
    }
  });

  // Get current user (reload from storage for fresh data)
  app.get("/api/auth/me", requireAuth, async (req: AuthRequest, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "No autenticado" });
    }
    
    // Reload user from storage to ensure fresh role data
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }
    
    // Update session with current data
    req.session.userRole = user.role;
    req.session.userName = user.name;
    req.session.userEmail = user.email;
    
    res.json({ user: sanitizeUser(user) });
  });

  // ============ CLASS ROUTES ============

  // Get all classes
  app.get("/api/classes", async (req, res) => {
    try {
      const classes = await storage.getAllClasses();
      res.json({ classes });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener clases" });
    }
  });

  // Get classes by date range
  app.get("/api/classes/range", async (req, res) => {
    try {
      const { start, end } = req.query;
      
      if (!start || !end) {
        return res.status(400).json({ error: "Fechas de inicio y fin son requeridas" });
      }

      const startDate = new Date(start as string);
      const endDate = new Date(end as string);

      const classes = await storage.getClassesByDateRange(startDate, endDate);
      res.json({ classes });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener clases" });
    }
  });

  // Create class (admin only)
  app.post("/api/classes", requireAdmin, async (req, res) => {
    try {
      const classData = insertClassSchema.parse(req.body);
      const newClass = await storage.createClass(classData);
      res.json({ class: newClass });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error al crear clase" });
    }
  });

  // Update class (admin only)
  app.patch("/api/classes/:id", requireAdmin, async (req, res) => {
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

  // Delete class (admin only)
  app.delete("/api/classes/:id", requireAdmin, async (req, res) => {
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

  // Load Supabase data (admin only)
  app.post("/api/admin/load-supabase", requireAdmin, async (req, res) => {
    try {
      console.log("[Admin] Loading Supabase data...");
      await storage.loadStudentsFromSupabase();
      res.json({ message: "Datos cargados correctamente desde Supabase" });
    } catch (error) {
      console.error("[Admin] Error loading Supabase:", error);
      res.status(500).json({ error: "Error al cargar datos de Supabase" });
    }
  });

  // ============ BOOKING ROUTES ============

  // Get user's bookings
  app.get("/api/bookings/user", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }

      const bookings = await storage.getBookingsByUser(req.user.id);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener reservas" });
    }
  });

  // Get bookings for a class with user details
  app.get("/api/bookings/class/:classId", async (req, res) => {
    try {
      const { classId } = req.params;
      const { status } = req.query;
      
      const bookings = await storage.getBookingsByClass(
        classId, 
        status as "active" | "cancelled" | "recovery" | undefined
      );
      
      // Enrich bookings with user details
      const enrichedBookings = await Promise.all(
        bookings.map(async (booking) => {
          const user = await storage.getUser(booking.userId);
          return {
            ...booking,
            userName: user?.name || "Usuario desconocido",
            userEmail: user?.email || "",
          };
        })
      );
      
      res.json({ bookings: enrichedBookings });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener reservas de la clase" });
    }
  });

  // Create booking
  app.post("/api/bookings", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }

      const bookingData = insertBookingSchema.parse({
        ...req.body,
        userId: req.user.id,
      });

      // Check class exists
      const classData = await storage.getClass(bookingData.classId);
      if (!classData) {
        return res.status(404).json({ error: "Clase no encontrada" });
      }

      // Check if class is on a holiday
      const holidays = await storage.getHolidays();
      const classDate = new Date(classData.startTime);
      const classDateStr = classDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      if (holidays.includes(classDateStr)) {
        return res.status(400).json({ error: "No se puede reservar una clase en día festivo" });
      }

      // Check 30-minute booking window
      const now = new Date();
      const classStartTime = new Date(classData.startTime);
      const minutesUntilClass = (classStartTime.getTime() - now.getTime()) / (1000 * 60);
      
      if (minutesUntilClass < 30) {
        return res.status(400).json({ 
          error: "No se puede reservar con menos de 30 minutos de antelación" 
        });
      }

      // Check class capacity
      if (classData.enrolled >= classData.capacity) {
        return res.status(400).json({ error: "Clase llena" });
      }

      // Create booking (storage prevents duplicates and adjusts enrollment)
      const booking = await storage.createBooking(bookingData);
      
      // Storage returns null if duplicate active booking exists
      if (!booking) {
        return res.status(409).json({ error: "Ya tienes una reserva activa para esta clase" });
      }

      res.json({ booking });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error al crear reserva" });
    }
  });

  // Cancel booking
  app.post("/api/bookings/:id/cancel", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }

      const { id } = req.params;
      const booking = await storage.getBooking(id);

      if (!booking) {
        return res.status(404).json({ error: "Reserva no encontrada" });
      }

      // Check ownership (unless admin)
      if (booking.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "No autorizado" });
      }

      // Check 2-hour cancellation window (students only, admins can override)
      if (req.user.role !== "admin") {
        const classData = await storage.getClass(booking.classId);
        if (classData) {
          const now = new Date();
          const classStartTime = new Date(classData.startTime);
          const hoursUntilClass = (classStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);
          
          if (hoursUntilClass < 2) {
            return res.status(400).json({ 
              error: "No se puede cancelar con menos de 2 horas de antelación" 
            });
          }
        }
      }

      // Cancel booking (storage automatically adjusts enrollment)
      const cancelled = await storage.cancelBooking(id);
      
      if (!cancelled) {
        return res.status(500).json({ error: "Error al cancelar reserva" });
      }

      res.json({ booking: cancelled });
    } catch (error) {
      res.status(500).json({ error: "Error al cancelar reserva" });
    }
  });

  // Update booking status (admin only)
  app.patch("/api/bookings/:id/status", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!["active", "cancelled", "recovery"].includes(status)) {
        return res.status(400).json({ error: "Estado inválido" });
      }

      // Storage layer handles enrollment reconciliation automatically
      const updated = await storage.updateBookingStatus(id, status);

      if (!updated) {
        return res.status(404).json({ error: "Reserva no encontrada" });
      }

      res.json({ booking: updated });
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar estado de reserva" });
    }
  });

  // ============ DEBUG ROUTES ============
  
  // Deep Supabase diagnostics
  app.get("/api/debug/supabase-test", async (req, res) => {
    try {
      const results: any = {
        tests: {}
      };

      // Test 1: Check if Supabase client is initialized
      const supabaseClient = (storage as any).supabase;
      results.tests.supabaseInitialized = !!supabaseClient;

      // Test 2: Try to fetch row count
      try {
        const { count, error: countError } = await supabaseClient
          .from("horarios_asistencia")
          .select("id", { count: "exact", head: true });
        
        results.tests.rowCount = { 
          count, 
          error: countError ? JSON.stringify(countError) : null 
        };
      } catch (e) {
        results.tests.rowCount = { error: JSON.stringify(e) };
      }

      // Test 3: Try to fetch just ID column
      try {
        const { data, error } = await supabaseClient
          .from("horarios_asistencia")
          .select("id");
        
        results.tests.fetchId = { 
          success: !error, 
          rowsReturned: data?.length || 0,
          error: error ? JSON.stringify(error) : null 
        };
      } catch (e) {
        results.tests.fetchId = { error: JSON.stringify(e) };
      }

      // Test 4: Try to fetch nombre alumno only
      try {
        const { data, error } = await supabaseClient
          .from("horarios_asistencia")
          .select("nombre alumno");
        
        results.tests.fetchNombre = { 
          success: !error, 
          rowsReturned: data?.length || 0,
          error: error ? JSON.stringify(error) : null,
          sample: data?.[0]
        };
      } catch (e) {
        results.tests.fetchNombre = { error: JSON.stringify(e) };
      }

      // Test 5: Try to fetch all columns
      try {
        const { data, error } = await supabaseClient
          .from("horarios_asistencia")
          .select("*");
        
        results.tests.fetchAll = { 
          success: !error, 
          rowsReturned: data?.length || 0,
          error: error ? JSON.stringify(error) : null,
          sample: data?.[0]
        };
      } catch (e) {
        results.tests.fetchAll = { error: JSON.stringify(e) };
      }

      // Test 6: Try raw REST call to see raw error
      try {
        const response = await fetch(
          `${process.env.SUPABASE_URL}/rest/v1/horarios_asistencia?select=id&limit=1`,
          {
            headers: {
              'apikey': process.env.SUPABASE_ANON_KEY || '',
              'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || ''}`
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

      // Test 7: Check alumnos table
      try {
        const { data, error, count } = await supabaseClient
          .from("alumnos")
          .select("*", { count: "exact" });
        
        results.tests.alumnosTable = {
          success: !error,
          count,
          rowsReturned: data?.length || 0,
          error: error ? JSON.stringify(error) : null
        };
      } catch (e) {
        results.tests.alumnosTable = { error: JSON.stringify(e) };
      }

      // Test 8: Check table info from Postgres
      try {
        const { data, error } = await supabaseClient
          .from("information_schema.tables")
          .select("table_name, table_schema")
          .eq("table_schema", "public");
        
        results.tests.tableListing = {
          success: !error,
          tables: data?.map((t: any) => t.table_name) || [],
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
  
  app.get("/api/debug/compare-supabase", async (req, res) => {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: "Supabase credentials not configured" });
      }

      // Dynamically import supabase client
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Fetch both tables
      const { data: horarios, error: horError } = await supabase
        .from("horarios_asistencia")
        .select("*");

      const { data: alumnos, error: alumError } = await supabase
        .from("alumnos")
        .select("*");

      if (horError || alumError) {
        return res.status(500).json({ 
          error: "Failed to fetch Supabase data",
          details: horError || alumError 
        });
      }

      // Compare data - handle dynamic column names
      const alumnosMap = new Map(
        alumnos.map((a: any) => {
          const nombre = a.nombre?.toLowerCase().trim();
          return [nombre, a];
        })
      );

      const missingData: any[] = [];
      const duplicateNames: Record<string, number> = {};
      const withMultipleSchedules: Record<string, any[]> = {};

      // Count occurrences
      horarios.forEach((h: any) => {
        const studentName = Object.keys(h).find(key => 
          key.toLowerCase().includes('nombre') && key.toLowerCase().includes('alumno')
        );
        const normName = h[studentName!]?.toLowerCase().trim();
        duplicateNames[normName] = (duplicateNames[normName] || 0) + 1;
      });

      // Find issues
      horarios.forEach((h: any) => {
        const studentNameKey = Object.keys(h).find(key => 
          key.toLowerCase().includes('nombre') && key.toLowerCase().includes('alumno')
        );
        const horaKey = Object.keys(h).find(key => key.toLowerCase() === 'hora');
        const diaKey = Object.keys(h).find(key => key.toLowerCase() === 'día');
        const typeKey = Object.keys(h).find(key => 
          key.toLowerCase().includes('tipo') && key.toLowerCase().includes('clase')
        );

        const normName = h[studentNameKey!]?.toLowerCase().trim();
        const alumData = alumnosMap.get(normName);

        if (duplicateNames[normName] > 1) {
          if (!withMultipleSchedules[h[studentNameKey!]]) {
            withMultipleSchedules[h[studentNameKey!]] = [];
          }
          withMultipleSchedules[h[studentNameKey!]].push({
            día: h[diaKey!],
            hora: h[horaKey!],
            tipo: h[typeKey!],
          });
        }

        if (!alumData || !alumData.email) {
          missingData.push({
            nombre: h[studentNameKey!],
            día: h[diaKey!],
            hora: h[horaKey!],
            tipo: h[typeKey!],
            email: alumData?.email || "MISSING",
          });
        }
      });

      res.json({
        totalHorarios: horarios.length,
        totalAlumnos: alumnos.length,
        missingData,
        withMultipleSchedules,
        allAlumnos: alumnos,
        horariosSample: horarios.slice(0, 2),
      });
    } catch (error) {
      res.status(500).json({ error: "Error comparing Supabase data", details: String(error) });
    }
  });

  // Debug: List all loaded students with their booking counts
  app.get("/api/admin/debug-loaded-students", requireAdmin, async (req, res) => {
    try {
      const allUsers = Array.from((storage as any).users?.values?.() || []) as any[];
      const allBookings = Array.from((storage as any).bookings?.values?.() || []) as any[];

      // Filter to Supabase-loaded students (role = student, not admin)
      const students = allUsers.filter(u => u.role === "student");

      // Count bookings per student
      const studentData = students.map(student => {
        const bookingCount = allBookings.filter(b => b.userId === student.id && b.status === "active").length;
        return {
          id: student.id,
          name: student.name,
          email: student.email,
          bookingCount
        };
      });

      // Sort by booking count
      studentData.sort((a, b) => a.bookingCount - b.bookingCount);

      res.json({
        totalStudents: students.length,
        totalBookings: allBookings.filter(b => b.status === "active").length,
        students: studentData,
        search: req.query.q ? studentData.filter(s => s.name.toLowerCase().includes((req.query.q as string).toLowerCase())) : []
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Debug: Check students from Supabase (admin only)
  app.get("/api/admin/debug-supabase-students", requireAdmin, async (req, res) => {
    try {
      const supabaseClient = (storage as any).supabase;
      
      // Get horarios_asistencia data
      const { data: horariosData, error: horariosError } = await supabaseClient
        .from("horarios_asistencia")
        .select("\"nombre alumno\", día, hora, \"tipo de clase\"");
      
      if (horariosError) {
        return res.status(500).json({ error: JSON.stringify(horariosError) });
      }

      // Get alumnos data
      const { data: alumnosData, error: alumnosError } = await supabaseClient
        .from("alumnos")
        .select("\"nombre alumno\", email");
      
      if (alumnosError) {
        return res.status(500).json({ error: JSON.stringify(alumnosError) });
      }

      // Create email map
      const alumnosArray = (alumnosData || []).map((a: any) => ({
        nombre: a["nombre alumno"].trim(),
        nombreLower: a["nombre alumno"].trim().toLowerCase(),
        email: a["email"].trim().toLowerCase()
      }));

      // Find which students from horarios don't have matches
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
              dia: row["día"],
              tipo: row["tipo de clase"]
            });
            break;
          }
        }
        
        if (!found) {
          notMatched.push({
            nombre: studentNameRaw,
            dia: row["día"],
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

  // Get class distribution by group (admin only)
  app.get("/api/admin/class-distribution", requireAdmin, async (req, res) => {
    try {
      const storageAny = storage as any;
      const bookingsArray = Array.from(storageAny.bookings?.values?.() || []);
      const classesArray = Array.from(storageAny.classes?.values?.() || []);
      const holidays = await storage.getHolidays();
      const holidaySet = new Set(holidays);
      
      // Build a map of classId -> class details
      const classMap: { [classId: string]: any } = {};
      const teachingDatesSet = new Set<string>();
      
      for (const cls of classesArray) {
        const clsData = cls as any;
        classMap[clsData.id] = clsData;
        
        // Track teaching dates (YYYY-MM-DD format)
        const classDate = new Date(clsData.startTime);
        const dateKey = `${classDate.getUTCFullYear()}-${String(classDate.getUTCMonth() + 1).padStart(2, "0")}-${String(classDate.getUTCDate()).padStart(2, "0")}`;
        if (!holidaySet.has(dateKey)) {
          teachingDatesSet.add(dateKey);
        }
      }
      
      // Group bookings by day + time (consolidate torno and modelado)
      const groupClasses: { [groupKey: string]: { groupName: string; studentCount: number; dayOfWeek: number } } = {};
      
      for (const booking of bookingsArray) {
        const b = booking as any;
        if (b.status !== "active") continue;
        
        const classData = classMap[b.classId];
        if (!classData) continue;
        
        const classStartTime = new Date(classData.startTime);
        const dayName = classStartTime.toLocaleDateString("es-ES", { weekday: "long" }).split(",")[0]; // e.g., "lunes"
        const timeStr = classStartTime.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false }); // e.g., "19:00"
        const groupName = `${dayName} ${timeStr}`;
        
        // Get day of week (0 = Sunday, 1 = Monday, etc. in UTC)
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
      
      // Convert to sorted array by day/time and count holidays for each group
      const distribution = Object.values(groupClasses)
        .map(group => {
          // Count holidays that fall on this group's day of week
          const holidaysInGroup = holidays.filter(holiday => {
            const holidayDate = new Date(holiday);
            // Convert UTC day to match: Monday=1, Tuesday=2, ..., Sunday=0
            // UTC: Monday=1, Tuesday=2, ..., Sunday=0
            // ES: lunes=1, martes=2, ..., domingo=0
            return holidayDate.getUTCDay() === group.dayOfWeek;
          }).length;
          
          return {
            groupName: group.groupName,
            studentCount: group.studentCount,
            holidaysCount: holidaysInGroup
          };
        })
        .sort((a, b) => {
          // Sort by day of week (lunes=1, martes=2, etc.) then by time
          const dayOrder: { [key: string]: number } = { 
            "lunes": 1, 
            "martes": 2, 
            "miércoles": 3, 
            "jueves": 4, 
            "viernes": 5, 
            "sábado": 6, 
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
      
      // Calculate stats
      const studentCounts = distribution.map(d => d.studentCount);
      const avgStudents = studentCounts.length > 0 
        ? studentCounts.reduce((a, b) => a + b, 0) / studentCounts.length 
        : 0;
      const teachingDays = teachingDatesSet.size;
      const holidaysCount = holidays.length;
      
      res.json({
        distribution,
        stats: {
          totalGroups: distribution.length,
          avgStudents: avgStudents.toFixed(2),
          teachingDays,
          holidays: holidaysCount,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener distribución de clases" });
    }
  });

  // Get class count by group for period (admin only)
  app.get("/api/admin/class-count-period", requireAdmin, async (req, res) => {
    try {
      const storageAny = storage as any;
      const classesArray = Array.from(storageAny.classes?.values?.() || []);
      const holidays = await storage.getHolidays();
      const holidaySet = new Set(holidays);
      
      // Period: Sept 2025 - June 2026
      const startDate = new Date("2025-09-01");
      const endDate = new Date("2026-06-30");
      
      // Group classes by day + time
      const groupClasses: { [groupKey: string]: { groupName: string; classCount: number; dayOfWeek: number; dates: Set<string> } } = {};
      
      for (const cls of classesArray) {
        const clsData = cls as any;
        const classDate = new Date(clsData.startTime);
        
        // Check if within period
        if (classDate < startDate || classDate > endDate) continue;
        
        const dateKey = `${classDate.getUTCFullYear()}-${String(classDate.getUTCMonth() + 1).padStart(2, "0")}-${String(classDate.getUTCDate()).padStart(2, "0")}`;
        
        // Skip if it's a holiday
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
            dates: new Set()
          };
        }
        
        groupClasses[groupName].classCount += 1;
        groupClasses[groupName].dates.add(dateKey);
      }
      
      // Convert to sorted array
      const distribution = Object.values(groupClasses)
        .map(group => ({
          groupName: group.groupName,
          classCount: group.classCount,
          dates: Array.from(group.dates).length
        }))
        .sort((a, b) => {
          const dayOrder: { [key: string]: number } = { 
            "lunes": 1, 
            "martes": 2, 
            "miércoles": 3, 
            "jueves": 4, 
            "viernes": 5, 
            "sábado": 6, 
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

  // Holiday routes (admin only)
  app.get("/api/admin/holidays", requireAdmin, async (req, res) => {
    try {
      const holidays = await storage.getHolidays();
      res.json({ holidays });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener días festivos" });
    }
  });

  app.post("/api/admin/holidays", requireAdmin, async (req, res) => {
    try {
      const { date } = req.body;
      if (!date) {
        return res.status(400).json({ error: "Date is required" });
      }
      await storage.addHoliday(date);
      res.json({ message: "Holiday added" });
    } catch (error) {
      res.status(500).json({ error: "Error al añadir día festivo" });
    }
  });

  app.delete("/api/admin/holidays/:date", requireAdmin, async (req, res) => {
    try {
      const { date } = req.params;
      await storage.removeHoliday(date);
      res.json({ message: "Holiday removed" });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar día festivo" });
    }
  });

  // Get all users (admin only)
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const storageAny = storage as any;
      const users = Array.from(storageAny.users?.values?.() || []);
      const students = users.filter((u: any) => u.role === "student");
      
      res.json({ users: students });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener estudiantes" });
    }
  });

  // Delete user (student) and cancel all their bookings (admin only)
  app.delete("/api/admin/users/:userId", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get all bookings for this user
      const userBookings = await storage.getBookingsByUser(userId);
      
      // Cancel all active bookings for this user
      for (const booking of userBookings) {
        if (booking.status === "active") {
          await storage.updateBookingStatus(booking.id, "cancelled");
        }
      }
      
      // Delete the user
      const deleted = await storage.deleteUser(userId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      
      res.json({ message: "Usuario eliminado correctamente" });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar usuario" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
