import { z } from "zod";

export const GENDERS = [
  "MALE",
  "FEMALE",
  "OTHER",
  "PREFER_NOT_TO_SAY",
] as const;

export const COMPLAINT_CATEGORIES = [
  "GARBAGE",
  "WATER_SUPPLY",
  "DRAINAGE_SEWAGE",
  "ROAD_POTHOLE",
  "STREET_LIGHT",
  "ELECTRICITY",
  "STRAY_ANIMALS",
  "ENCROACHMENT",
  "PUBLIC_TOILET",
  "NOISE_POLLUTION",
  "TRAFFIC",
  "HEALTH_SANITATION",
  "OTHER",
] as const;

export const COMPLAINT_PRIORITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const;

export const COMPLAINT_STATUSES = [
  "SUBMITTED",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
  "RESOLVED",
  "REJECTED",
  "CLOSED",
] as const;

/** PMC / PCMC administrative ward offices. */
export const PUNE_WARDS = [
  "Aundh - Baner",
  "Ghole Road",
  "Bhavani Peth",
  "Dhole Patil Road",
  "Hadapsar - Mundhwa",
  "Kasba - Vishrambaug Wada",
  "Kondhwa - Yewalewadi",
  "Koregaon Park",
  "Nagar Road - Vadgaon Sheri",
  "Bibwewadi",
  "Dhankawadi - Sahakarnagar",
  "Sinhagad Road",
  "Warje - Karvenagar",
  "Kothrud - Bavdhan",
  "Shivajinagar - Ghole Road",
  "Yerwada - Kalas - Dhanori",
  "Wanowrie - Ramtekdi",
  "Pimpri - Chinchwad",
  "Other",
] as const;

export const CATEGORY_LABELS: Record<
  (typeof COMPLAINT_CATEGORIES)[number],
  string
> = {
  GARBAGE: "Garbage & Waste Collection",
  WATER_SUPPLY: "Water Supply",
  DRAINAGE_SEWAGE: "Drainage & Sewage",
  ROAD_POTHOLE: "Roads & Potholes",
  STREET_LIGHT: "Street Lighting",
  ELECTRICITY: "Electricity",
  STRAY_ANIMALS: "Stray Animals",
  ENCROACHMENT: "Encroachment",
  PUBLIC_TOILET: "Public Toilets",
  NOISE_POLLUTION: "Noise Pollution",
  TRAFFIC: "Traffic & Parking",
  HEALTH_SANITATION: "Health & Sanitation",
  OTHER: "Other",
};

export const STATUS_LABELS: Record<
  (typeof COMPLAINT_STATUSES)[number],
  string
> = {
  SUBMITTED: "Submitted",
  ACKNOWLEDGED: "Acknowledged",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
  CLOSED: "Closed",
};

/* ------------------------------------------------------------------ */
/* Primitive field rules                                               */
/* ------------------------------------------------------------------ */

const indianMobile = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+91|0091|91)/, ""))
  .pipe(
    z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  );

const pincode = z
  .string()
  .trim()
  .regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code");

const strongPassword = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(128, "Password is too long")
  .regex(/[a-z]/, "Include at least one lowercase letter")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/\d/, "Include at least one number")
  .regex(/[^A-Za-z0-9]/, "Include at least one special character");

const personName = z
  .string()
  .trim()
  .min(2, "Too short")
  .max(80, "Too long")
  .regex(
    /^[\p{L}\s.'-]+$/u,
    "Only letters, spaces, apostrophes and hyphens are allowed",
  );

/* ------------------------------------------------------------------ */
/* Module 1 - Resident registration & profile                          */
/* ------------------------------------------------------------------ */

export const registerSchema = z
  .object({
    firstName: personName,
    lastName: personName,
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Enter a valid email address")
      .max(191),
    mobile: indianMobile,
    password: strongPassword,
    confirmPassword: z.string(),
    dateOfBirth: z
      .string()
      .optional()
      .refine((v) => {
        if (!v) return true;
        const d = new Date(v);
        if (Number.isNaN(d.getTime())) return false;
        const age = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
        return age >= 13 && age <= 120;
      }, "Residents must be at least 13 years old"),
    gender: z.enum(GENDERS).default("PREFER_NOT_TO_SAY"),
    addressLine: z.string().trim().min(5, "Address is too short").max(255),
    locality: z.string().trim().max(120).optional().or(z.literal("")),
    ward: z.string().trim().max(120).optional().or(z.literal("")),
    city: z.string().trim().min(2).max(80).default("Pune"),
    state: z.string().trim().min(2).max(80).default("Maharashtra"),
    pincode,
    profilePhoto: z.string().max(512).optional().or(z.literal("")),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms to continue" }),
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const profileUpdateSchema = z.object({
  firstName: personName,
  lastName: personName,
  mobile: indianMobile,
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.enum(GENDERS),
  addressLine: z.string().trim().min(5).max(255),
  locality: z.string().trim().max(120).optional().or(z.literal("")),
  ward: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode,
  profilePhoto: z.string().max(512).optional().or(z.literal("")),
});

/* ------------------------------------------------------------------ */
/* Module 2 - Grievance management                                     */
/* ------------------------------------------------------------------ */

export const complaintCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(6, "Title must be at least 6 characters")
    .max(150),
  description: z
    .string()
    .trim()
    .min(20, "Please describe the issue in at least 20 characters")
    .max(5000),
  category: z.enum(COMPLAINT_CATEGORIES),
  priority: z.enum(COMPLAINT_PRIORITIES).default("MEDIUM"),
  areaAddress: z.string().trim().min(5, "Area address is required").max(255),
  landmark: z.string().trim().max(150).optional().or(z.literal("")),
  ward: z.string().trim().max(120).optional().or(z.literal("")),
  pincode,
  contactNumber: indianMobile,
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  photos: z
    .array(
      z.object({
        url: z.string().max(512),
        fileName: z.string().max(255),
        mimeType: z.string().max(100),
        sizeBytes: z.number().int().nonnegative(),
      }),
    )
    .max(5, "A maximum of 5 photos can be attached")
    .default([]),
});

export const complaintListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(COMPLAINT_STATUSES).optional(),
  category: z.enum(COMPLAINT_CATEGORIES).optional(),
  q: z.string().trim().max(100).optional(),
  ward: z.string().trim().max(120).optional(),
});

export const complaintStatusUpdateSchema = z.object({
  status: z.enum(COMPLAINT_STATUSES),
  note: z.string().trim().max(2000).optional().or(z.literal("")),
  priority: z.enum(COMPLAINT_PRIORITIES).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ComplaintCreateInput = z.infer<typeof complaintCreateSchema>;
