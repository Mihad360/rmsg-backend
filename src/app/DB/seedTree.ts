import { UserModel } from "../modules/User/user.model";
import { MemberModel } from "../modules/Member/member.model";
import { TreeModel } from "../modules/Tree/tree.model";

// ─────────────────────────────────────────────
// Seed payload — update emails when client provides real ones
// ─────────────────────────────────────────────
const FAMILY_DATA = [
  // ROOT
  {
    name: "Mohammad",
    email: "mohammad@gmail.com",
    password: "123456",
    role: "superAdmin",

    gender: "male",
    age: 78,
    dateOfBirth: new Date("1948-03-12"),

    phone: "+966500000001",
    address: "Building 10, King Fahd Road",
    country: "Saudi Arabia",
    countryCode: "SA",
    region: "Riyadh Province",
    city: "Riyadh",
    district: "Al Olaya",

    bio: "Head of the Mohammad family tree.",
    employmentStatus: "employed",
    education: "Islamic Studies",
    educationLevel: "Masters",
    universityName: "King Saud University",
    fieldOfWork: "Business",

    linkedinLink: "https://linkedin.com/in/mohammad",

    isRoot: true,
    isActive: true,
    isVerified: true,
    isDeleted: false,
  },

  // CHILDREN
  {
    name: "Lulouah",
    email: "lulouah@gmail.com",
    password: "123456",
    role: "user",

    gender: "female",
    age: 52,
    dateOfBirth: new Date("1974-06-20"),

    phone: "+966500000002",
    city: "Riyadh",
    district: "Al Yasmin",
    country: "Saudi Arabia",
    countryCode: "SA",

    bio: "Family member from Riyadh.",
    employmentStatus: "employed",
    education: "Education",
    educationLevel: "Bachelor",
    universityName: "Princess Nourah University",
    fieldOfWork: "Teacher",

    spouseName: "Fahad",
    spousePhone: "+966511111111",

    isActive: true,
    isVerified: true,
  },

  {
    name: "Ibrahim",
    email: "ibrahim@gmail.com",
    password: "123456",
    role: "user",

    gender: "male",
    age: 50,
    dateOfBirth: new Date("1976-01-15"),

    phone: "+966500000003",
    city: "Jeddah",
    district: "Al Rawdah",
    country: "Saudi Arabia",
    countryCode: "SA",

    bio: "Works in construction management.",
    employmentStatus: "employed",
    education: "Engineering",
    educationLevel: "Bachelor",
    universityName: "King Abdulaziz University",
    fieldOfWork: "Civil Engineer",

    spouseName: "Sara",
    spousePhone: "+966522222222",

    isActive: true,
    isVerified: true,
  },

  {
    name: "Huda",
    email: "huda@gmail.com",
    password: "123456",
    role: "user",

    gender: "female",
    age: 48,
    dateOfBirth: new Date("1978-09-11"),

    phone: "+966500000004",
    city: "Dammam",
    district: "Al Faisaliyah",
    country: "Saudi Arabia",
    countryCode: "SA",

    bio: "Interested in healthcare and volunteering.",
    employmentStatus: "employed",
    education: "Medical Science",
    educationLevel: "Masters",
    universityName: "Imam Abdulrahman Bin Faisal University",
    fieldOfWork: "Healthcare",

    spouseName: "Khaled",
    spousePhone: "+966533333333",

    isActive: true,
    isVerified: true,
  },

  {
    name: "Nassir",
    email: "nassir@gmail.com",
    password: "123456",
    role: "user",

    gender: "male",
    age: 46,
    dateOfBirth: new Date("1980-04-18"),

    phone: "+966500000005",
    city: "Riyadh",
    district: "Al Malqa",
    country: "Saudi Arabia",
    countryCode: "SA",

    bio: "Technology enthusiast.",
    employmentStatus: "employed",
    education: "Computer Science",
    educationLevel: "Bachelor",
    universityName: "King Saud University",
    fieldOfWork: "Software Engineer",

    spouseName: "Nora",
    spousePhone: "+966544444444",

    linkedinLink: "https://linkedin.com/in/nassir",

    isActive: true,
    isVerified: true,
  },

  {
    name: "Haifa",
    email: "haifa@gmail.com",
    password: "123456",
    role: "user",

    gender: "female",
    age: 44,
    dateOfBirth: new Date("1982-08-25"),

    phone: "+966500000006",
    city: "Madinah",
    district: "Qurban",
    country: "Saudi Arabia",
    countryCode: "SA",

    bio: "Works in fashion and design.",
    employmentStatus: "employed",
    education: "Arts",
    educationLevel: "Bachelor",
    universityName: "Taibah University",
    fieldOfWork: "Designer",

    isActive: true,
    isVerified: true,
  },

  {
    name: "Wafa",
    email: "wafa@gmail.com",
    password: "123456",
    role: "user",

    gender: "female",
    age: 42,
    dateOfBirth: new Date("1984-02-17"),

    phone: "+966500000007",
    city: "Jeddah",
    district: "Al Zahra",
    country: "Saudi Arabia",
    countryCode: "SA",

    employmentStatus: "unemployed",
    education: "Business",
    educationLevel: "Bachelor",

    isActive: true,
    isVerified: true,
  },

  {
    name: "Maha",
    email: "maha@gmail.com",
    password: "123456",
    role: "user",

    gender: "female",
    age: 40,
    dateOfBirth: new Date("1986-11-10"),

    phone: "+966500000008",
    city: "Riyadh",
    district: "Al Nakheel",
    country: "Saudi Arabia",
    countryCode: "SA",

    employmentStatus: "employed",
    education: "Marketing",
    educationLevel: "Masters",
    fieldOfWork: "Marketing Specialist",

    isActive: true,
    isVerified: true,
  },

  {
    name: "Nada",
    email: "nada@gmail.com",
    password: "123456",
    role: "user",

    gender: "female",
    age: 38,
    dateOfBirth: new Date("1988-05-09"),

    phone: "+966500000009",
    city: "Makkah",
    district: "Al Aziziyah",
    country: "Saudi Arabia",
    countryCode: "SA",

    employmentStatus: "employed",
    education: "Law",
    educationLevel: "Bachelor",
    fieldOfWork: "Legal Advisor",

    isActive: true,
    isVerified: true,
  },

  {
    name: "Abdulaziz",
    email: "abdulaziz@gmail.com",
    password: "123456",
    role: "user",

    gender: "male",
    age: 36,
    dateOfBirth: new Date("1990-12-01"),

    phone: "+966500000010",
    city: "Tabuk",
    district: "Al Muruj",
    country: "Saudi Arabia",
    countryCode: "SA",

    employmentStatus: "employed",
    education: "Information Technology",
    educationLevel: "Bachelor",
    fieldOfWork: "IT Consultant",

    linkedinLink: "https://linkedin.com/in/abdulaziz",

    isActive: true,
    isVerified: true,
  },

  {
    name: "Nahla",
    email: "nahla@gmail.com",
    password: "123456",
    role: "user",

    gender: "female",
    age: 34,
    dateOfBirth: new Date("1992-07-21"),

    phone: "+966500000011",
    city: "Abha",
    district: "Al Sadd",
    country: "Saudi Arabia",
    countryCode: "SA",

    employmentStatus: "employed",
    education: "Psychology",
    educationLevel: "Masters",
    fieldOfWork: "Psychologist",

    isActive: true,
    isVerified: true,
  },
];

const DEFAULT_PASSWORD = "123456";

export const seedTree = async () => {
  try {
    // ── Guard: skip if already seeded
    const existingTree = await TreeModel.findOne({ isDefault: true });
    if (existingTree) {
      console.log("Default tree already seeded, skipping.");
      return;
    }

    // ── 1. Create Tree
    const tree = await TreeModel.create({
      name: "Mohammad",
      totalMembers: 0,
      isDefault: true,
      isDeleted: false,
    });

    // ── 2. Root data
    const rootData = FAMILY_DATA.find((f) => f.isRoot);
    if (!rootData) throw new Error("Root user not found in FAMILY_DATA");

    // ── 3. Create root member
    const rootMember = await MemberModel.create({
      tree: tree._id,
      parent: null,
      label: rootData.name,
      level: 0,
      relationType: "blood",
      placementStatus: "placed",
      isTreeRoot: true,
      isDeleted: false,
    });

    // ── 4. Create root user (FULL PROFILE SUPPORTED)
    const rootUser = await UserModel.create({
      name: rootData.name,
      email: rootData.email,
      password: DEFAULT_PASSWORD,
      role: "user",

      gender: rootData.gender,
      age: rootData.age,
      dateOfBirth: rootData.dateOfBirth,

      phone: rootData.phone,
      address: rootData.address,
      country: rootData.country,
      countryCode: rootData.countryCode,
      region: rootData.region,
      city: rootData.city,
      district: rootData.district,

      bio: rootData.bio,
      employmentStatus: rootData.employmentStatus,
      education: rootData.education,
      educationLevel: rootData.educationLevel,
      universityName: rootData.universityName,
      fieldOfWork: rootData.fieldOfWork,
      linkedinLink: rootData.linkedinLink,

      isVerified: true,
      isActive: true,
      isDeleted: false,

      motherTree: tree._id,
      linkedMember: rootMember._id,
      treeJoinStatus: "placed",
    });

    await MemberModel.findByIdAndUpdate(rootMember._id, {
      linkedUser: rootUser._id,
    });

    // ── 5. Children
    const children = FAMILY_DATA.filter((f) => !f.isRoot);

    let childCount = 0;

    for (const child of children) {
      const member = await MemberModel.create({
        tree: tree._id,
        parent: rootMember._id,
        label: child.name,
        level: 1,
        relationType: "blood",
        placementStatus: "placed",
        isTreeRoot: false,
        isDeleted: false,
      });

      const user = await UserModel.create({
        name: child.name,
        email: child.email,
        password: DEFAULT_PASSWORD,
        role: "user",

        gender: child.gender,
        age: child.age,
        dateOfBirth: child.dateOfBirth,

        phone: child.phone,
        address: child.address,
        country: child.country,
        countryCode: child.countryCode,
        region: child.region,
        city: child.city,
        district: child.district,

        bio: child.bio,
        employmentStatus: child.employmentStatus,
        education: child.education,
        educationLevel: child.educationLevel,
        universityName: child.universityName,
        fieldOfWork: child.fieldOfWork,
        spouseName: child.spouseName,
        spousePhone: child.spousePhone,
        linkedinLink: child.linkedinLink,

        isVerified: true,
        isActive: true,
        isDeleted: false,

        motherTree: tree._id,
        linkedMember: member._id,
        treeJoinStatus: "placed",
      });

      await MemberModel.findByIdAndUpdate(member._id, {
        linkedUser: user._id,
      });

      childCount++;
    }

    // ── 6. Final tree update
    await TreeModel.findByIdAndUpdate(tree._id, {
      rootMember: rootMember._id,
      totalMembers: childCount + 1,
    });

    console.log("✅ Default tree seeded successfully");
    console.log(`Root: ${rootData.name}`);
    console.log(`Children: ${childCount}`);
  } catch (error) {
    console.error("❌ Error seeding default tree:", error);
    throw error;
  }
};
