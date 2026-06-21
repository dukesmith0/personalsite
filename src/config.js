// ---------------------------------------------------------------------------
// Site content - edit everything here. Drop images in /public/images/ and set
// the `image` fields; the cards/portrait will use them automatically.
// ---------------------------------------------------------------------------

export const PROFILE = {
  name: "Duke Smith",
  role: "Aerospace · Satellite Instrumentation",
  email: "craigdukesmith@gmail.com",
  github: "https://github.com/", // TODO: your profile
  linkedin: "https://www.linkedin.com/", // TODO: your profile
  resume: "", // optional: /resume.pdf
};

export const PROJECTS = [
  {
    title: "Bi-Propellant Engine Test Stand",
    body: "Designed and instrumented a 500 lbf liquid engine test stand - feed system, load cells, and a real-time data pipeline capturing chamber pressure at 2 kHz.",
    tags: ["LOX / Kerosene", "Instrumentation", "CAD"],
    image: "", // e.g. /images/test-stand.jpg
  },
  {
    title: "CubeSat Attitude Control",
    body: "Wrote flight software for a 3U CubeSat ADCS - reaction-wheel control, sun-pointing mode, and a Kalman filter fusing magnetometer and gyro data.",
    tags: ["Embedded C", "Kalman Filter", "Flight SW"],
    image: "",
  },
  {
    title: "Satellite Instrument Bring-Up",
    body: "Current work: bench characterization and calibration of flight instrumentation - signal chains, sensor integration, and test automation. (Edit in src/config.js)",
    tags: ["Sensors", "Calibration", "Test Automation"],
    image: "",
  },
];

// TODO: replace with your real history / dates. Five cards, most recent first.
export const EXPERIENCE = [
  {
    when: "Now",
    org: "Satellite Instrumentation",
    role: "Instrumentation Engineer",
    body: "Building and characterizing flight instrumentation - sensor integration and calibration for spaceflight hardware.",
  },
  {
    when: "Recent",
    org: "Propulsion Test",
    role: "Test Engineer",
    body: "Stood up engine test campaigns - feed systems, load cells, and high-rate data capture for hot-fire validation.",
  },
  {
    when: "Earlier",
    org: "Maintenance",
    role: "Maintenance Technician",
    body: "Hands-on maintenance and troubleshooting of complex hardware - the practical foundation behind the work.",
  },
  {
    when: "Internship",
    org: "Aerospace R&D",
    role: "Engineering Intern",
    body: "Prototyped avionics and bench fixtures - first exposure to flight hardware bring-up and lab automation.",
  },
  {
    when: "Education",
    org: "UCLA",
    role: "Aerospace Engineering",
    body: "Propulsion, controls, and flight software - from engine test stands to CubeSat attitude determination.",
  },
];

export const ABOUT = [
  "I'm an aerospace engineer working on satellite instrumentation. I came up through hands-on maintenance, which is where I learned how real hardware actually fails - and now I build and characterize the instruments that fly.",
  "My work lives at the seam between mechanical hardware and the signal chains that measure it: propulsion test stands, CubeSat flight software, and flight-instrument bring-up.",
];
