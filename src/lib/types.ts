// Application data model — matches the 1OF1AUTO-APPLICATION-FLOW-SPEC

export type HousingStatus = "own" | "mortgage" | "rent" | "family" | "other";
export type ApplicationMode = "individual" | "co-applicant" | "business";

export type PersonData = {
  // From DL OCR
  licenseFile: File | null;
  licenseImage: string | null; // data URL for preview
  firstName: string;
  middleName: string;
  lastName: string;
  dob: string; // YYYY-MM-DD
  licenseNumber: string;
  licenseAddress: string; // full address as on DL
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
  registration: File | null;
  utilityBill: File | null; // if DL address ≠ registering address
  businessLicense: File | null; // if business application
};

export type AgreementData = {
  signatureData: string;
  agreed: boolean;
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
};

export const emptyPerson = (): PersonData => ({
  licenseFile: null,
  licenseImage: null,
  firstName: "",
  middleName: "",
  lastName: "",
  dob: "",
  licenseNumber: "",
  licenseAddress: "",
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
  registration: null,
  utilityBill: null,
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
