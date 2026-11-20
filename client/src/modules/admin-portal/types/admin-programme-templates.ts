import type { ProgrammeInput } from "./admin-programmes.types";

export interface StrategicProgrammeTemplate extends Pick<ProgrammeInput, "name" | "programmeType" | "targetAudience" | "description" | "programContent" | "eligibility"> {
  key: string;
}

export const strategicProgrammeTemplates: StrategicProgrammeTemplate[] = [
  {
    key: "foundation",
    name: "TGE Foundation",
    programmeType: "Foundational Programme",
    targetAudience: "Any new TGE member, regardless of age or sector, including project leaders in ideation or pre-startup.",
    description: "Mandatory entry pathway that lays entrepreneurial foundations, introduces essential business tools, and integrates new participants into the TGE community.",
    programContent: [
      "Ideation and entrepreneurial creativity: generate and validate project ideas",
      "Business Model Canvas: develop each section using the participant's project",
      "Value Proposition Canvas: define the offer and target clientele",
      "Introduction to Quebec's entrepreneurial ecosystem, actors, resources, and programmes",
      "Volunteer integration into a TGE committee",
      "Provide the TGE Entrepreneur Kit upon registration",
      "Complete and sign a participation commitment agreement",
    ],
    eligibility: "Open to every new TGE member. This programme is the required first stage of the TGE pathway.",
  },
  {
    key: "young-entrepreneur",
    name: "Young Entrepreneur (18–39)",
    programmeType: "Cohort Programme",
    targetAudience: "TGE members aged 18 to 39 with a business start-up or development project.",
    description: "Comprehensive, intensive entrepreneurial training for young entrepreneurs from immigrant backgrounds.",
    programContent: [
      "Develop and professionally present a business plan",
      "Financial planning: projections, profitability analysis, and cash-flow management",
      "Networking strategies, tools, and implementation",
      "Pitch techniques, storytelling, practice, and feedback",
      "Professional written and oral communication and public speaking",
      "Marketing strategy, positioning, segmentation, acquisition, and retention",
      "Digital management and marketing, including social media, SEO, online advertising, and digital tools",
    ],
    eligibility: "Members aged 18–39 must have completed TGE Foundation and have a business start-up or development project.",
  },
  {
    key: "the-entrepreneur",
    name: "The Entrepreneur",
    programmeType: "Cohort Programme",
    targetAudience: "TGE members aged 40 and over, or members of any age seeking comprehensive support, who are starting or growing a business amid complex personal, family, or cultural realities.",
    description: "Comprehensive entrepreneurial support that addresses business development alongside the personal, family, and cultural dimensions of entrepreneurship after immigration to Quebec.",
    programContent: [
      "Develop and adapt a complete business plan for the Quebec market",
      "Advanced financial planning, financing, and accessible grants",
      "Professional networking strategies adapted to Quebec",
      "Pitch techniques and personalized support",
      "Written, oral, and intercultural communication",
      "Integrated marketing and digital management strategy",
      "Work-life balance, time management, and burnout prevention",
      "Adapting to Quebec's cultural codes, administrative and legal systems, and resources",
      "Managing family responsibilities in an entrepreneurial context",
    ],
    eligibility: "Applicants must have completed TGE Foundation and have a start-up or growing business. Intended for members aged 40+, or any age where comprehensive support fits their needs.",
  },
  {
    key: "personalized-support",
    name: "Personalized Support (Mentoring)",
    programmeType: "Mentoring Programme",
    targetAudience: "Entrepreneurs who completed Young Entrepreneur or The Entrepreneur and need individualized support to consolidate or grow their project.",
    description: "The mentoring stage of the TGE pathway pairs each entrepreneur with a dedicated mentor to consolidate the project, address obstacles, and prepare for business launch or growth.",
    programContent: [
      "Match each participant with a mentor by sector, profile, and specific needs",
      "Hold individual meetings biweekly or monthly according to the agreed schedule",
      "Monitor objectives defined at the end of the cohort programme",
      "Provide access to TGE experts in finance, law, marketing, and other fields as needed",
      "Submit a quarterly progress report to the member and archive it in the TGE file",
    ],
    eligibility: "Participants must complete stage 2: Young Entrepreneur or The Entrepreneur. Mentor matching is based on sector, profile, and needs.",
  },
];
