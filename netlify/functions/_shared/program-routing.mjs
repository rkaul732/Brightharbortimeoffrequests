const brightHarborDomain = "@brightharbor.org";

function clean(value) {
  return String(value || "").trim();
}

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function person(role, name, email) {
  return { role, name, email: clean(email).toLowerCase() };
}

export const programRouting = [
  {
    program: "Community Resources for Emergency Support and Treatment (CREST)",
    supervisors: [
      person("Coordinator", "Kim Mott", "kmott@brightharbor.org"),
      person("Assistant Director", "Leigh Reinwald", "lreinwald@brightharbor.org"),
      person("Director", "Gina Del Pizzo", "gdelpizzo@brightharbor.org")
    ]
  },
  {
    program: "Crisis Diversion",
    supervisors: [
      person("Coordinator", "Courtney Tokgoz", "ctokgoz@brightharbor.org"),
      person("Assistant Director", "Leigh Reinwald", "lreinwald@brightharbor.org"),
      person("Director", "Gina Del Pizzo", "gdelpizzo@brightharbor.org")
    ]
  },
  {
    program: "Involuntary Outpatient Commitment",
    supervisors: [
      person("Coordinator", "Courtney Tokgoz", "ctokgoz@brightharbor.org"),
      person("Assistant Director", "Leigh Reinwald", "lreinwald@brightharbor.org"),
      person("Director", "Gina Del Pizzo", "gdelpizzo@brightharbor.org")
    ]
  },
  {
    program: "PACT I",
    supervisors: [
      person("Coordinator", "Rochelle Davis", "rdavis@brightharbor.org"),
      person("Assistant Director", "Leigh Reinwald", "lreinwald@brightharbor.org"),
      person("Director", "Gina Del Pizzo", "gdelpizzo@brightharbor.org")
    ]
  },
  {
    program: "PACT II",
    supervisors: [
      person("Coordinator", "Stephanie Wrocklage", "swrocklage@brightharbor.org"),
      person("Assistant Director", "Leigh Reinwald", "lreinwald@brightharbor.org"),
      person("Director", "Gina Del Pizzo", "gdelpizzo@brightharbor.org")
    ]
  },
  {
    program: "Access",
    supervisors: [
      person("Coordinator", "Kelly Rafter", "krafter@brightharbor.org"),
      person("Assistant Director", "Michele Harper", "mharper@brightharbor.org"),
      person("Director", "Meghan Corrigan", "mcorrigan@brightharbor.org")
    ]
  },
  {
    program: "LEAP (Arrive Together, On POINT, Barricaded Subjects)",
    supervisors: [
      person("Coordinator", "Kimberly Shalloo", "kshalloo@brightharbor.org"),
      person("Assistant Director", "Michele Harper", "mharper@brightharbor.org"),
      person("Director", "Meghan Corrigan", "mcorrigan@brightharbor.org")
    ]
  },
  {
    program: "Outpatient Services",
    supervisors: [
      person("Coordinator", "Nicole Sullivan", "nsullivan@brightharbor.org"),
      person("Assistant Director", "Michele Harper", "mharper@brightharbor.org"),
      person("Director", "Meghan Corrigan", "mcorrigan@brightharbor.org")
    ]
  },
  {
    program: "Intensive Family Support Services",
    supervisors: [
      person("Coordinator", "Mary Lough Normile", "mloughnormile@brightharbor.org"),
      person("Assistant Director", "Michele Harper", "mharper@brightharbor.org"),
      person("Director", "Meghan Corrigan", "mcorrigan@brightharbor.org")
    ]
  },
  {
    program: "Oasis",
    supervisors: [
      person("Coordinator", "Arielle Dymyd", "adymyd@brightharbor.org"),
      person("Assistant Director", "Michele Harper", "mharper@brightharbor.org"),
      person("Director", "Meghan Corrigan", "mcorrigan@brightharbor.org")
    ]
  },
  {
    program: "Integrated System of Care (ISC)",
    supervisors: [
      person("Coordinator", "Arielle Dymyd", "adymyd@brightharbor.org"),
      person("Assistant Director", "Michele Harper", "mharper@brightharbor.org"),
      person("Director", "Meghan Corrigan", "mcorrigan@brightharbor.org")
    ]
  },
  {
    program: "Intensive Outpatient",
    supervisors: [
      person("Coordinator", "Laurel Juliano", "ljuliano@brightharbor.org"),
      person("Assistant Director", "Michele Harper", "mharper@brightharbor.org"),
      person("Director", "Meghan Corrigan", "mcorrigan@brightharbor.org")
    ]
  },
  {
    program: "Level I Outpatient",
    supervisors: [
      person("Coordinator", "Laurel Juliano", "ljuliano@brightharbor.org"),
      person("Assistant Director", "Michele Harper", "mharper@brightharbor.org"),
      person("Director", "Meghan Corrigan", "mcorrigan@brightharbor.org")
    ]
  },
  {
    program: "Medication Assisted Treatment (MAT)",
    supervisors: [
      person("Coordinator", "Laurel Juliano", "ljuliano@brightharbor.org"),
      person("Assistant Director", "Michele Harper", "mharper@brightharbor.org"),
      person("Director", "Meghan Corrigan", "mcorrigan@brightharbor.org")
    ]
  },
  {
    program: "Shore Haven",
    supervisors: [
      person("Coordinator", "Chris Noroski", "cnoroski@brightharbor.org"),
      person("Assistant Director", "Michele Harper", "mharper@brightharbor.org"),
      person("Director", "Meghan Corrigan", "mcorrigan@brightharbor.org")
    ]
  },
  {
    program: "Building Empowerment to Achieve Community Housing (BEACH)",
    supervisors: [
      person("Coordinator", "Nicole Prisco", "nprisco@brightharbor.org"),
      person("Director", "Michele Manganello", "mmanganello@brightharbor.org")
    ]
  },
  {
    program: "Beacon/Anchor",
    supervisors: [
      person("Coordinator", "Melissa Griffith", "mgriffith@brightharbor.org"),
      person("Director", "Michele Manganello", "mmanganello@brightharbor.org")
    ]
  },
  {
    program: "Chelsea",
    supervisors: [
      person("Coordinator", "Nicole Prisco", "nprisco@brightharbor.org"),
      person("Director", "Michele Manganello", "mmanganello@brightharbor.org")
    ]
  },
  {
    program: "Supportive Housing Assistance to Reach Excellence (SHARE)",
    supervisors: [
      person("Coordinator", "Dawn Schleicher", "dschleicher@brightharbor.org"),
      person("Director", "Michele Manganello", "mmanganello@brightharbor.org")
    ]
  },
  {
    program: "Wellness Assistance Valuing Excellence (WAVE)",
    supervisors: [
      person("Coordinator", "Kathy White", "kwhite@brightharbor.org"),
      person("Director", "Michele Manganello", "mmanganello@brightharbor.org")
    ]
  },
  {
    program: "Progressive Assistance to Transition from Homelessness (PATH)",
    supervisors: [
      person("Coordinator", "Dawn Schleicher", "dschleicher@brightharbor.org"),
      person("Director", "Michele Manganello", "mmanganello@brightharbor.org")
    ]
  },
  {
    program: "Housing Supports Program (HSP)",
    supervisors: [
      person("Coordinator", "Michael Daly", "mdaly@brightharbor.org"),
      person("Director", "Michele Manganello", "mmanganello@brightharbor.org")
    ]
  },
  {
    program: "TIDES",
    supervisors: [person("Director", "Michele Manganello", "mmanganello@brightharbor.org")]
  },
  {
    program: "Bayside",
    supervisors: [
      person("Coordinator", "Morgan Durnalds", "mdurnalds@brightharbor.org"),
      person("Director", "Tonya Molhem", "tmolhem@brightharbor.org")
    ]
  },
  {
    program: "Empowering Mind, Body and Recovery after Challenging Experiences (EMBRACE)",
    supervisors: [
      person("Coordinator", "Isabel Morales-Marvel", "imorales@brightharbor.org"),
      person("Director", "Tonya Molhem", "tmolhem@brightharbor.org")
    ]
  },
  {
    program: "Intensive In Community Services (IIC)",
    supervisors: [
      person("Coordinator", "Michele Juska", "mjuska@brightharbor.org"),
      person("Director", "Tonya Molhem", "tmolhem@brightharbor.org")
    ]
  },
  {
    program: "Children & Families Outpatient Services",
    supervisors: [
      person("Coordinator", "Isabel Morales-Marvel", "imorales@brightharbor.org"),
      person("Director", "Tonya Molhem", "tmolhem@brightharbor.org")
    ]
  },
  {
    program: "Healing through Outpatient Personal Education & Support (HOPES)",
    supervisors: [person("Director", "Tonya Molhem", "tmolhem@brightharbor.org")]
  },
  {
    program: "Keeping Families Together - OCEAN",
    supervisors: [
      person("Coordinator", "Christina Lassik", "classik@brightharbor.org"),
      person("Director", "Tonya Molhem", "tmolhem@brightharbor.org")
    ]
  },
  {
    program: "Keeping Families Together - MONMOUTH",
    supervisors: [
      person("Coordinator", "Alexa Sickles", "asickles@brightharbor.org"),
      person("Director", "Tonya Molhem", "tmolhem@brightharbor.org")
    ]
  },
  {
    program: "Supervised Visits",
    supervisors: [
      person("Coordinator", "Morgan Durnalds", "mdurnalds@brightharbor.org"),
      person("Director", "Tonya Molhem", "tmolhem@brightharbor.org")
    ]
  },
  {
    program: "Diversion",
    supervisors: [
      person("Coordinator", "Janice Freeman-Kenney", "jkenney@brightharbor.org"),
      person("Director", "Reena Johnson", "rjohnson@brightharbor.org")
    ]
  },
  {
    program: "Youth Electronic Monitoring",
    supervisors: [
      person("Coordinator", "Amanda Christie", "achristie@brightharbor.org"),
      person("Director", "Reena Johnson", "rjohnson@brightharbor.org")
    ]
  },
  {
    program: "Youth Recovery Services (YRS)",
    supervisors: [
      person("Coordinator", "Jose Madrigal", "jmadrigal@brightharbor.org"),
      person("Director", "Reena Johnson", "rjohnson@brightharbor.org")
    ]
  },
  {
    program: "Family Crisis Intervention Unit (FCIU)",
    supervisors: [
      person("Coordinator", "Jose Madrigal", "jmadrigal@brightharbor.org"),
      person("Director", "Reena Johnson", "rjohnson@brightharbor.org")
    ]
  },
  {
    program: "REAL Team",
    supervisors: [
      person("Coordinator", "Sean Kingston", "skingston@brightharbor.org"),
      person("Director", "Reena Johnson", "rjohnson@brightharbor.org")
    ]
  },
  {
    program: "The NOOK",
    supervisors: [
      person("Coordinator", "Vinnie Pizzimenti", "vpizzimenti@brightharbor.org"),
      person("Director", "Reena Johnson", "rjohnson@brightharbor.org")
    ]
  },
  {
    program: "Ocean Academy",
    supervisors: [person("Director", "Tom Nonnis", "tnonnis@brightharbor.org")]
  },
  {
    program: "SOLAS",
    supervisors: [
      person("Coordinator", "Lynn Mabee-Puff", "lmabeepuff@brightharbor.org"),
      person("Director", "Kathy Greene", "kgreene@brightharbor.org")
    ]
  }
];

export const programOptions = programRouting.map((entry) => entry.program);

const programAliases = {
  "bridge clinic": "Access",
  "wellness access": "Access",
  "hope outpatient": "Outpatient Services",
  outpatient: "Outpatient Services",
  "lighthouse recovery": "Empowering Mind, Body and Recovery after Challenging Experiences (EMBRACE)",
  recovery: "Empowering Mind, Body and Recovery after Challenging Experiences (EMBRACE)",
  "shoreline residential": "Shore Haven",
  "harbor house": "Supportive Housing Assistance to Reach Excellence (SHARE)",
  isc: "Integrated System of Care (ISC)",
  "integrated system of care": "Integrated System of Care (ISC)",
  iic: "Intensive In Community Services (IIC)",
  "intensive in community services": "Intensive In Community Services (IIC)",
  "intensive in-community services": "Intensive In Community Services (IIC)",
  "on point/arrive together": "LEAP (Arrive Together, On POINT, Barricaded Subjects)",
  "on point": "LEAP (Arrive Together, On POINT, Barricaded Subjects)",
  "arrive together": "LEAP (Arrive Together, On POINT, Barricaded Subjects)",
  "leap": "LEAP (Arrive Together, On POINT, Barricaded Subjects)",
  beach: "Building Empowerment to Achieve Community Housing (BEACH)",
  share: "Supportive Housing Assistance to Reach Excellence (SHARE)",
  wave: "Wellness Assistance Valuing Excellence (WAVE)",
  path: "Progressive Assistance to Transition from Homelessness (PATH)",
  hsp: "Housing Supports Program (HSP)",
  embrace: "Empowering Mind, Body and Recovery after Challenging Experiences (EMBRACE)",
  hopes: "Healing through Outpatient Personal Education & Support (HOPES)",
  yrs: "Youth Recovery Services (YRS)",
  fciu: "Family Crisis Intervention Unit (FCIU)"
};

export function programLabel(value) {
  const text = clean(value);
  return programAliases[text.toLowerCase()] || text;
}

export function isAllowedProgram(value) {
  return programOptions.includes(programLabel(value));
}

export function normalizeProgramList(value) {
  const raw = Array.isArray(value)
    ? value
    : String(value || "")
        .split(/[;,|]/)
        .map((item) => item.trim());

  const programs = raw.map(programLabel).filter(isAllowedProgram);
  return Array.from(new Set(programs));
}

export function requireProgramList(value) {
  const programs = normalizeProgramList(value);
  if (!programs.length) {
    throw httpError(400, "Choose at least one program.");
  }
  return programs;
}

export function programListValue(programs) {
  return normalizeProgramList(programs).join("; ");
}

export function supervisorsForProgram(program) {
  const label = programLabel(program);
  return programRouting.find((entry) => entry.program === label)?.supervisors || [];
}

export function supervisorEmailsForProgram(program) {
  return uniqueEmails(supervisorsForProgram(program).map((supervisor) => supervisor.email));
}

export function supervisorEmailsForPrograms(programs) {
  return uniqueEmails(normalizeProgramList(programs).flatMap(supervisorEmailsForProgram));
}

export function supervisorSummaryForProgram(program) {
  return supervisorsForProgram(program)
    .map((supervisor) => `${supervisor.name} (${supervisor.role})`)
    .join("; ");
}

export function supervisorSummaryForPrograms(programs) {
  const seen = new Set();
  const supervisors = normalizeProgramList(programs).flatMap(supervisorsForProgram);
  return supervisors
    .filter((supervisor) => {
      const key = supervisor.email || `${supervisor.name}:${supervisor.role}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((supervisor) => `${supervisor.name} (${supervisor.role})`)
    .join("; ");
}

export function canReviewProgram(email, program) {
  const normalized = clean(email).toLowerCase();
  if (!normalized.endsWith(brightHarborDomain)) return false;
  return supervisorEmailsForProgram(program).includes(normalized);
}

export function uniqueEmails(values) {
  return Array.from(
    new Set(
      values
        .map((value) => clean(value).toLowerCase())
        .filter((value) => value && value.endsWith(brightHarborDomain))
    )
  );
}
