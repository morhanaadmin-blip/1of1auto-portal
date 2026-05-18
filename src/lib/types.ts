// Application data model — matches the 1OF1AUTO-APPLICATION-FLOW-SPEC

export type HousingStatus = "own" | "mortgage" | "rent" | "family" | "other";
export type ApplicationMode = "individual" | "co-applicant" | "business";

export type PersonData = {
  // From DL OCR
  licenseFile: File | null;
  licenseImage: string | null; // data URL for preview
  dlPhotoTracking: { scanned: boolean; skipped: boolean } | null; // track if scan was attempted or skipped
  firstName: string;
  middleName: string;
  lastName: string;
  dob: string; // YYYY-MM-DD
  licenseNumber: string;
  licenseAddress: string; // full address as on DL (raw / display)
  licenseStreet: string;
  licenseCity: string;
  licenseState: string;
  licenseZip: string;
  // From CRM (pre-filled)
  email: string;
  phone: string;
  // Customer-entered
  ssn: string;
  registeringAddressSame: boolean | null; // is DL address = registering address?
  registeringAddress: string; // only if registeringAddressSame === false
  // Housing
  yearsAtAddress: string;
  monthsAtAddress: string;
  housingStatus: HousingStatus | "";
  monthlyHousingPayment: string;
  // Income
  annualIncome: string;
  monthlyIncome: string;
  // Employment
  occupation: string;
  employerName: string;
  employerStreet: string;
  employerCity: string;
  employerState: string;
  employerZip: string;
  employerPhone: string;
  yearsWorked: string;
  monthsWorked: string;
};

export type BusinessData = {
  legalName: string;
  title: string;
  ownershipPercent: string;
  ein: string;
  phone: string;
  address: string;
  suite: string;
  poBox: string;
  city: string;
  state: string;
  zip: string;
  establishedDate: string;
  stateOfIncorporation: string;
  numEmployees: string;
  yearsInBusiness: string;
  // Bank info
  bankName: string;
  bankAccountNumber: string;
  bankContactName: string;
  bankContactPhone: string;
};

export type DocumentData = {
  insurance: File | null;
  insuranceOptional: boolean; // checkbox: "I don't have current insurance"
  registration: File | null;
  registrationOptional: boolean; // checkbox: "I will NOT be transferring my current registration"
  utilityBill: File | null; // if DL address ≠ registering address
  driverLicensePhoto: File | null; // mandatory: uploaded if scan was skipped
  businessLicense: File | null; // if business application
};

export type AgreementData = {
  signatureData: string;
  agreed: boolean;
};

export type ApplicationStatus = "submitted" | "review_pending" | "approved" | "denied" | "needs_info";

export type ApplicationRecord = {
  id: string;
  stripe_session_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  application_mode: ApplicationMode;
  status: ApplicationStatus;
  drive_folder_id: string | null;
  application_json: ApplicationData;
  primary_license_file_name: string | null;
  co_applicant_license_file_name: string | null;
  insurance_file_name: string | null;
  registration_file_name: string | null;
  utility_bill_file_name: string | null;
  driver_license_photo_file_name: string | null;
  business_license_file_name: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  notes: string | null;
};

// Paths to files already uploaded to Supabase before the Stripe redirect.
// Strings survive JSON serialization; File objects do not.
export type StagedFiles = {
  primaryLicense?: string | null;
  coAppLicense?: string | null;
  insurance?: string | null;
  registration?: string | null;
  driverLicensePhoto?: string | null;
  utilityBill?: string | null;
  businessLicense?: string | null;
};

export type ApplicationData = {
  mode: ApplicationMode;
  primary: PersonData;
  coApplicant: PersonData | null;
  business: BusinessData | null;
  documents: DocumentData;
  agreement: AgreementData;
  depositPaid: boolean;
  stripeSessionId: string;
  _staged?: StagedFiles;
};

export const emptyPerson = (): PersonData => ({
  licenseFile: null,
  licenseImage: null,
  dlPhotoTracking: null,
  firstName: "",
  middleName: "",
  lastName: "",
  dob: "",
  licenseNumber: "",
  licenseAddress: "",
  licenseStreet: "",
  licenseCity: "",
  licenseState: "",
  licenseZip: "",
  email: "",
  phone: "",
  ssn: "",
  registeringAddressSame: null,
  registeringAddress: "",
  yearsAtAddress: "",
  monthsAtAddress: "",
  housingStatus: "",
  monthlyHousingPayment: "",
  annualIncome: "",
  monthlyIncome: "",
  occupation: "",
  employerName: "",
  employerStreet: "",
  employerCity: "",
  employerState: "",
  employerZip: "",
  employerPhone: "",
  yearsWorked: "",
  monthsWorked: "",
});

export const emptyBusiness = (): BusinessData => ({
  legalName: "",
  title: "",
  ownershipPercent: "",
  ein: "",
  phone: "",
  address: "",
  suite: "",
  poBox: "",
  city: "",
  state: "",
  zip: "",
  establishedDate: "",
  stateOfIncorporation: "",
  numEmployees: "",
  yearsInBusiness: "",
  bankName: "",
  bankAccountNumber: "",
  bankContactName: "",
  bankContactPhone: "",
});

export const emptyDocuments = (): DocumentData => ({
  insurance: null,
  insuranceOptional: false,
  registration: null,
  registrationOptional: false,
  utilityBill: null,
  driverLicensePhoto: null,
  businessLicense: null,
});

export const emptyApplication = (): ApplicationData => ({
  mode: "individual",
  primary: emptyPerson(),
  coApplicant: null,
  business: null,
  documents: emptyDocuments(),
  agreement: { signatureData: "", agreed: false },
  depositPaid: false,
  stripeSessionId: "",
});
