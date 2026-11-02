// ==========================================
// SweafEx Platform — Shared Types & Enums
// ==========================================

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGEMENT = 'MANAGEMENT',
  SALES = 'SALES',
  TRAFFIC_OPS = 'TRAFFIC_OPS',
  ACCOUNTS = 'ACCOUNTS'
}

export enum EntityStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED'
}

export enum VerificationStatus {
  VERIFIED = 'VERIFIED',
  UNVERIFIED = 'UNVERIFIED',
  PENDING_CHECK = 'PENDING_CHECK'
}

export enum ComplianceStatus {
  VALID = 'VALID',
  EXPIRING_SOON = 'EXPIRING_SOON', // Within 30 days
  EXPIRED = 'EXPIRED'
}

export enum VendorPartyType {
  BROKER = 'BROKER',
  FLEET_OWNER = 'FLEET_OWNER',
  TRUCK_OWNER = 'TRUCK_OWNER',
  TRANSPORTER = 'TRANSPORTER',
  COMMISSION_AGENT = 'COMMISSION_AGENT'
}

export enum EnquiryStatus {
  NEW = 'NEW',
  SENT_TO_PURCHASE = 'SENT_TO_PURCHASE',
  QUOTES_RECEIVED = 'QUOTES_RECEIVED',
  RATE_SET = 'RATE_SET',
  CONFIRMED_ORDER = 'CONFIRMED_ORDER',
  CANCELLED_CLOSED = 'CANCELLED_CLOSED'
}

export enum EnquiryClosureReason {
  RATE_DIFFERENCE = 'Rate Difference',
  CUSTOMER_ARRANGED_OWN_VEHICLE = 'Customer Arranged Own Vehicle',
  VEHICLE_NOT_AVAILABLE = 'Vehicle Not Available',
  CUSTOMER_UNRESPONSIVE = 'Customer Unresponsive',
  OTHER = 'Other'
}

export enum EnquirySourceChannel {
  WHATSAPP = 'WHATSAPP',
  WEBSITE = 'WEBSITE',
  PHONE = 'PHONE',
  INSTAGRAM = 'INSTAGRAM',
  DIRECT_VISIT = 'DIRECT_VISIT'
}

export enum QuoteAvailability {
  AVAILABLE = 'AVAILABLE',
  UNAVAILABLE = 'UNAVAILABLE',
  TENTATIVE = 'TENTATIVE'
}

export enum RequirementFinalStatus {
  OPEN = 'OPEN',
  VENDOR_SHORTLISTED = 'VENDOR_SHORTLISTED',
  READY_FOR_PLACEMENT = 'READY_FOR_PLACEMENT',
  PLACED_EXP = 'PLACED_EXP',
  DROPPED = 'DROPPED'
}

export enum VehicleType {
  CONTAINER_32_MXL = '32 FT Multi-Axle (MXL)',
  CONTAINER_32_SXL = '32 FT Single-Axle (SXL)',
  CONTAINER_24_FT = '24 FT Container',
  CONTAINER_20_FT = '20 FT Container',
  OPEN_20_FT = '20 FT Open Body',
  OPEN_14_FT = '14 FT Open Body',
  TAURUS_16T = '16 Ton Taurus',
  TAURUS_21T = '21 Ton Taurus',
  OPEN_BODY = 'Open Body Truck',
  TRAILER = 'Flatbed Trailer'
}

export enum DocumentType {
  GST_CERTIFICATE = 'GST_CERTIFICATE',
  PAN_CARD = 'PAN_CARD',
  MSME_CERTIFICATE = 'MSME_CERTIFICATE',
  RC_COPY = 'RC_COPY',
  INSURANCE_POLICY = 'INSURANCE_POLICY',
  FITNESS_CERTIFICATE = 'FITNESS_CERTIFICATE',
  NATIONAL_PERMIT = 'NATIONAL_PERMIT',
  TAX_RECEIPT = 'TAX_RECEIPT',
  PUCC_CERTIFICATE = 'PUCC_CERTIFICATE',
  DRIVING_LICENSE = 'DRIVING_LICENSE',
  BANK_CANCELLED_CHEQUE = 'BANK_CANCELLED_CHEQUE',
  TRANSPORTER_AGREEMENT = 'TRANSPORTER_AGREEMENT',
  CUSTOMER_CONTRACT = 'CUSTOMER_CONTRACT',
  POD_DOCUMENT = 'POD_DOCUMENT',
  OTHER = 'OTHER'
}

// User & Auth
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  isActive: boolean;
  department?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

// Customer Master
export interface CustomerContact {
  id: string;
  customerId: string;
  name: string;
  designation?: string | null;
  email?: string | null;
  phone: string;
  isPrimary: boolean;
}

export interface CustomerCorridor {
  id: string;
  customerId: string;
  originCity: string;
  originState: string;
  destCity: string;
  destState: string;
  standardVehicleType?: string | null;
  agreedRate?: number | null;
  billingBasis: string; // e.g. PER_TRIP, PER_TON, PER_KG
  notes?: string | null;
}

export interface CustomerRateContract {
  id: string;
  customerId: string;
  contractNumber?: string | null;
  validFrom: string;
  validTo: string;
  standardPaymentDays: number;
  isActive: boolean;
  termsAndConditions?: string | null;
}

export interface Customer {
  id: string;
  customerCode: string; // e.g. CUST-001
  companyName: string;
  tradeName?: string | null;
  gstin: string;
  pan: string;
  billingAddress: string;
  city: string;
  state: string;
  pincode: string;
  industry?: string | null;
  paymentTermsDays: number;
  creditLimit: number;
  status: EntityStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  contacts?: CustomerContact[];
  corridors?: CustomerCorridor[];
  rateContracts?: CustomerRateContract[];
}

// Transporter Master (Vendor CRM)
export interface TransporterBankDetail {
  id: string;
  transporterId: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName?: string | null;
  isPrimary: boolean;
  isVerified: boolean;
}

export interface Transporter {
  id: string;
  transporterCode: string; // e.g. TRP-001
  companyName: string;
  tradeName?: string | null;
  partyType: VendorPartyType | string; // BROKER, FLEET_OWNER, etc.
  gstin?: string | null;
  pan: string;
  contactPerson: string;
  phone: string;
  email?: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  transportName?: string | null;
  brokerName?: string | null;
  truckOwnerName?: string | null;
  brokerOwnerPhone?: string | null;
  standardPaymentDays: number;
  rating?: number | null;
  reliabilityRating?: number | null;
  responseTimeMinutes?: number | null;
  totalTripsCount: number;
  status: EntityStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  bankDetails?: TransporterBankDetail[];
  vehiclesCount?: number;
  driversCount?: number;
}

// Fleet & Vehicles
export interface Vehicle {
  id: string;
  vehicleNumber: string; // e.g. AP39UB3717
  transporterId?: string | null;
  transporterName?: string | null;
  vehicleSize?: string | null; // e.g. 20 Feet, 32 Feet
  vehicleType: string; // Open, Container, etc.
  carryingCapacityTons: number;
  passingCapacityTons?: number | null; // RTO Passing
  rcNumber: string;
  rcExpiryDate?: string | null;
  insuranceNumber?: string | null;
  insuranceExpiryDate?: string | null;
  fitnessExpiryDate?: string | null;
  taxExpiryDate?: string | null;
  puccExpiryDate?: string | null;
  permitNumber?: string | null;
  permitExpiryDate?: string | null;
  isBlacklisted: boolean;
  blacklistReason?: string | null;
  isVerified: boolean;
  verificationStatus: VerificationStatus | string;
  status: EntityStatus;
  gpsInstalled: boolean;
  gpsDeviceId?: string | null;
  createdAt: string;
  updatedAt: string;
  // Computed compliance flags
  rcComplianceStatus?: ComplianceStatus;
  insuranceComplianceStatus?: ComplianceStatus;
  fitnessComplianceStatus?: ComplianceStatus;
  taxComplianceStatus?: ComplianceStatus;
  puccComplianceStatus?: ComplianceStatus;
  permitComplianceStatus?: ComplianceStatus;
}

// Driver Master
export interface Driver {
  id: string;
  transporterId?: string | null;
  transporterName?: string | null;
  fullName: string;
  phone: string;
  altPhone?: string | null;
  licenseNumber: string; // DL
  licenseExpiryDate: string;
  dlCompatibility?: string | null; // HTV / LTV
  aadhaarNumber?: string | null;
  city?: string | null;
  state?: string | null;
  isBlacklisted: boolean;
  isVerified: boolean;
  verificationStatus: VerificationStatus | string;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
  // Computed compliance flag
  licenseComplianceStatus?: ComplianceStatus;
}

// Vendor Quotations (Up to 4 quotes per enquiry)
export interface VendorQuote {
  id: string;
  enquiryId: string;
  requirementId?: string | null;
  quoteNumber: number; // 1, 2, 3, 4
  transporterId: string;
  transporterName: string;
  transporterPhone?: string | null;
  quotedRate: number;
  availability: QuoteAvailability | string;
  vehicleNumber?: string | null;
  quoteExpiry?: string | null;
  isBestRate: boolean;
  isSelected: boolean;
  notes?: string | null;
  quotedAt: string;
}

// Customer Enquiry
export interface Enquiry {
  id: string;
  enquiryNumber: string; // ENQ1071
  enquiryDate: string;
  customerId: string;
  customerName: string;
  sourceChannel: EnquirySourceChannel | string;
  loadingAreaPin: string; // e.g. "Kumbalgodu - 560026"
  loadingCity: string;
  unloadingAreaPin: string; // e.g. "Tuni - 531127"
  unloadingCity: string;
  vehicleLength: string; // e.g. "20 Feet"
  vehicleType: string; // e.g. "Open"
  materialType: string; // e.g. "Iron and Steel"
  materialWeight: string; // e.g. "7 Tonnes"
  loadingDate: string;
  loadingRequirement: string; // "Now" or "Scheduled"
  targetPrice?: number | null;
  status: EnquiryStatus | string;
  closureReason?: EnquiryClosureReason | string | null;
  notes?: string | null;
  createdById?: string | null;
  createdByName?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  quotes?: VendorQuote[];
  requirement?: Requirement | null;
}

// Requirement (Structured Operational Requirement)
export interface Requirement {
  id: string;
  requirementNumber: string; // REQ001
  enquiryId: string;
  enquiryNumber: string;
  requirementDate: string;
  customerId: string;
  customerName: string;
  loadingAreaPin: string;
  loadingCity: string;
  unloadingAreaPin: string;
  unloadingCity: string;
  vehicleLength: string;
  vehicleType: string;
  materialType: string;
  materialWeight: string;
  loadingDate: string;
  tripRate?: number | null;
  finalStatus: RequirementFinalStatus | string;
  selectedQuoteId?: string | null;
  selectedTransporterId?: string | null;
  selectedTransporterName?: string | null;
  selectedVehicleId?: string | null;
  selectedVehicleNumber?: string | null;
  selectedDriverId?: string | null;
  selectedDriverName?: string | null;
  selectedDriverPhone?: string | null;
  selectedDriverDl?: string | null;
  finalTripId?: string | null; // e.g. EXP0369 for Segment 2 handoff
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  enquiry?: Enquiry;
  quotes?: VendorQuote[];
}

// CRM Search Filters (12 Filters)
export interface CrmSearchParams {
  vehicleNumber?: string;
  vehicleSize?: string;
  unloadingArea?: string;
  vendorParty?: string;
  vehicleType?: string;
  tripId?: string;
  loadingCity?: string;
  weightPassing?: string;
  driverName?: string;
  unloadingCity?: string;
  loadingArea?: string;
  tripStatus?: string;
}

// Compliance Record
export interface ComplianceAlertItem {
  id: string;
  entityType: 'VEHICLE' | 'DRIVER';
  entityId: string;
  identifier: string; // Vehicle Number or Driver Name
  associatedTransporter?: string | null;
  documentType: DocumentType | string;
  expiryDate: string;
  daysRemaining: number;
  status: ComplianceStatus;
}

export interface ComplianceSummary {
  totalVehicles: number;
  totalDrivers: number;
  validVehiclesCount: number;
  expiringVehiclesCount: number;
  expiredVehiclesCount: number;
  validDriversCount: number;
  expiringDriversCount: number;
  expiredDriversCount: number;
  urgentAlerts: ComplianceAlertItem[];
}

// Audit Trail
export interface AuditLogItem {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}
