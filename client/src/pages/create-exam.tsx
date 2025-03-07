import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { insertExamSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PageHeader } from "@/components/ui/page-header";
import type { QuestionTemplate } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const CURRICULA = [
  "ICSE",
  "CBSE",
  "Karnataka State Board",
  "JEE (Main)",
  "JEE (Advanced)",
  "NEET",
  "KVPY",
  "BITSAT"
];

const DIFFICULTIES = [
  "Beginner",
  "Foundation",
  "Easy",
  "Medium",
  "Advanced",
  "Hard",
  "Expert",
  "Olympiad"
];
const GRADES = ["8", "9", "10", "11", "12", "Competitive"];

// Subject combinations for different curricula
const CURRICULUM_SUBJECTS = {
  "JEE (Main)": ["Physics", "Chemistry", "Mathematics"],
  "JEE (Advanced)": ["Physics", "Chemistry", "Mathematics"],
  "NEET": ["Physics", "Chemistry", "Biology"],
  "KVPY": ["Physics", "Chemistry", "Mathematics", "Biology"],
  "BITSAT": ["Physics", "Chemistry", "Mathematics", "English", "Logical Reasoning"],
  "ICSE": [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "History & Civics",
    "Geography",
    "English Literature",
    "English Language",
    "Economics",
    "Computer Science"
  ],
  "CBSE": ["Mathematics", "Physics", "Chemistry"],
  "Karnataka State Board": ["Mathematics", "Physics", "Chemistry"]
};

// Detailed chapter information by curriculum and subject
const TEXTBOOK_CHAPTERS = {
  "JEE (Main)": {
    "Physics": {
      title: "JEE Main Physics",
      chapters: [
        "Kinematics",
        "Laws of Motion",
        "Work, Energy and Power",
        "Rotational Motion",
        "Gravitation",
        "Properties of Matter",
        "Thermodynamics",
        "Kinetic Theory of Gases",
        "Oscillations and Waves",
        "Electrostatics",
        "Current Electricity",
        "Magnetic Effects of Current",
        "Magnetism",
        "Electromagnetic Induction",
        "Optics",
        "Modern Physics",
        "Semiconductor Electronics"
      ]
    },
    "Chemistry": {
      title: "JEE Main Chemistry",
      chapters: [
        "Atomic Structure",
        "Chemical Bonding",
        "States of Matter",
        "Thermodynamics",
        "Chemical Equilibrium",
        "Solutions",
        "Electrochemistry",
        "Chemical Kinetics",
        "Surface Chemistry",
        "Periodic Table",
        "Organic Chemistry Basics",
        "Hydrocarbons",
        "Organic Compounds with Functional Groups",
        "Biomolecules",
        "Polymers",
        "Chemistry in Everyday Life"
      ]
    },
    "Mathematics": {
      title: "JEE Main Mathematics",
      chapters: [
        "Sets and Functions",
        "Complex Numbers",
        "Matrices and Determinants",
        "Permutations and Combinations",
        "Mathematical Induction",
        "Binomial Theorem",
        "Sequences and Series",
        "Limits and Derivatives",
        "Integral Calculus",
        "Differential Equations",
        "Coordinate Geometry",
        "Vectors and 3D Geometry",
        "Statistics and Probability",
        "Trigonometry",
        "Mathematical Reasoning"
      ]
    }
  },
  "JEE (Advanced)": {
    "Physics": {
      title: "JEE Advanced Physics",
      chapters: [
        "Classical Mechanics",
        "Fluid Mechanics",
        "Thermal Physics",
        "Waves and Sound",
        "Optics",
        "Electrostatics",
        "Current Electricity",
        "Magnetism and EMI",
        "Modern Physics",
        "Nuclear Physics",
        "Semiconductor Devices",
        "Communication Systems",
        "Experimental Physics",
        "Units and Measurements",
        "Error Analysis"
      ]
    },
    "Chemistry": {
      title: "JEE Advanced Chemistry",
      chapters: [
        "Atomic Structure and Chemical Bonding",
        "States of Matter",
        "Chemical Thermodynamics",
        "Chemical and Ionic Equilibrium",
        "Electrochemistry",
        "Chemical Kinetics",
        "Surface Chemistry",
        "Coordination Chemistry",
        "Qualitative Analysis",
        "Organic Chemistry Mechanisms",
        "Biomolecules",
        "Polymers",
        "Environmental Chemistry",
        "General Principles and Processes of Isolation of Elements",
        "p-Block Elements",
        "d and f Block Elements",
        "Analytical Chemistry"
      ]
    },
    "Mathematics": {
      title: "JEE Advanced Mathematics",
      chapters: [
        "Complex Numbers and Quadratic Equations",
        "Matrices and Determinants",
        "Sets, Relations and Functions",
        "Mathematical Induction",
        "Permutations and Combinations",
        "Binomial Theorem",
        "Sequences and Series",
        "Differential Calculus",
        "Integral Calculus",
        "Differential Equations",
        "Vector Algebra",
        "3D Geometry",
        "Probability",
        "Mathematical Logic",
        "Linear Programming",
        "Conic Sections",
        "Advanced Trigonometry"
      ]
    }
  },
  "NEET": {
    "Biology": {
      title: "NEET Biology",
      chapters: [
        "Diversity in Living World",
        "Structural Organization in Plants and Animals",
        "Cell Structure and Function",
        "Plant Physiology",
        "Human Physiology",
        "Reproduction",
        "Genetics and Evolution",
        "Biology and Human Welfare",
        "Biotechnology and Its Applications",
        "Ecology and Environment",
        "Animal Kingdom",
        "Plant Kingdom",
        "Biomolecules",
        "Cell Division",
        "Transport in Plants",
        "Mineral Nutrition",
        "Photosynthesis",
        "Respiration",
        "Plant Growth and Development",
        "Human Physiology",
        "Neural Control and Coordination",
        "Chemical Coordination and Integration"
      ]
    },
    "Physics": {
      title: "NEET Physics",
      chapters: [
        "Physical World and Measurement",
        "Kinematics",
        "Laws of Motion",
        "Work, Energy and Power",
        "Motion of System of Particles and Rigid Body",
        "Gravitation",
        "Properties of Bulk Matter",
        "Thermodynamics",
        "Behaviour of Perfect Gas and Kinetic Theory",
        "Oscillations and Waves",
        "Electrostatics",
        "Current Electricity",
        "Magnetic Effects of Current and Magnetism",
        "Electromagnetic Induction and Alternating Currents",
        "Electromagnetic Waves",
        "Optics",
        "Dual Nature of Matter and Radiation",
        "Atoms and Nuclei",
        "Electronic Devices"
      ]
    },
    "Chemistry": {
      title: "NEET Chemistry",
      chapters: [
        "Some Basic Concepts of Chemistry",
        "Structure of Atom",
        "Classification of Elements and Periodicity",
        "Chemical Bonding and Molecular Structure",
        "States of Matter",
        "Thermodynamics",
        "Equilibrium",
        "Redox Reactions",
        "Hydrogen",
        "s-Block Elements",
        "p-Block Elements",
        "Organic Chemistry – Some Basic Principles",
        "Hydrocarbons",
        "Environmental Chemistry",
        "Solutions",
        "Electrochemistry",
        "Chemical Kinetics",
        "Surface Chemistry",
        "General Principles of Isolation of Elements",
        "d and f Block Elements",
        "Coordination Compounds",
        "Haloalkanes and Haloarenes",
        "Alcohols, Phenols and Ethers",
        "Aldehydes, Ketones and Carboxylic Acids",
        "Organic Compounds Containing Nitrogen",
        "Biomolecules",
        "Polymers",
        "Chemistry in Everyday Life"
      ]
    }
  },
  "BITSAT": {
    "English": {
      title: "BITSAT English Proficiency",
      chapters: [
        "Reading Comprehension",
        "Verbal Ability",
        "English Language",
        "Vocabulary",
        "Grammar Usage",
        "Sentence Completion",
        "Critical Reasoning"
      ]
    },
    "Logical Reasoning": {
      title: "BITSAT Logical Reasoning",
      chapters: [
        "Logical Deduction",
        "Verbal Reasoning",
        "Non-verbal Reasoning",
        "Data Interpretation",
        "Pattern Recognition",
        "Analytical Reasoning",
        "Critical Thinking"
      ]
    },
    "Physics": {
      title: "BITSAT Physics",
      chapters: [
        "Kinematics",
        "Laws of Motion",
        "Work, Energy and Power",
        "Rotational Motion",
        "Gravitation",
        "Properties of Matter",
        "Thermodynamics",
        "Kinetic Theory of Gases",
        "Oscillations and Waves",
        "Electrostatics",
        "Current Electricity",
        "Magnetic Effects of Current",
        "Magnetism",
        "Electromagnetic Induction",
        "Optics",
        "Modern Physics",
        "Semiconductor Electronics"
      ]
    },
    "Chemistry": {
      title: "BITSAT Chemistry",
      chapters: [
        "Atomic Structure",
        "Chemical Bonding",
        "States of Matter",
        "Thermodynamics",
        "Chemical Equilibrium",
        "Solutions",
        "Electrochemistry",
        "Chemical Kinetics",
        "Surface Chemistry",
        "Periodic Table",
        "Organic Chemistry Basics",
        "Hydrocarbons",
        "Organic Compounds with Functional Groups",
        "Biomolecules",
        "Polymers",
        "Chemistry in Everyday Life"
      ]
    },
    "Mathematics": {
      title: "BITSAT Mathematics",
      chapters: [
        "Sets and Functions",
        "Complex Numbers",
        "Matrices and Determinants",
        "Permutations and Combinations",
        "Mathematical Induction",
        "Binomial Theorem",
        "Sequences and Series",
        "Limits and Derivatives",
        "Integral Calculus",
        "Differential Equations",
        "Coordinate Geometry",
        "Vectors and 3D Geometry",
        "Statistics and Probability",
        "Trigonometry",
        "Mathematical Reasoning"
      ]
    }
  },
  "ICSE": {
    "8": {
      "Mathematics": {
        title: "Concise Mathematics Middle School (NEP 2020 aligned)",
        publisher: "Selina",
        author: "RK Bansal",
        chapters: [
          "Number Systems",
          "Operations on Numbers",
          "Squares and Square Roots",
          "Cubes and Cube Roots",
          "Exponents and Powers",
          "Algebraic Expressions and Identities",
          "Linear Equations in One Variable",
          "Understanding Quadrilaterals",
          "Data Handling",
          "Mensuration",
          "Introduction to Graphs",
          "Direct and Inverse Proportions",
          "Factorisation",
          "Introduction to Pythagoras Theorem"
        ]
      },
      "Physics": {
        title: "Concise Physics Middle School",
        publisher: "Selina",
        author: "Dr RP Goyal",
        chapters: [
          "Force and Pressure",
          "Friction",
          "Sound",
          "Light",
          "Energy",
          "Heat Transfer",
          "Electric Current and its Effects",
          "Magnetic Effects of Current",
          "Some Natural Phenomena",
          "Stars and the Solar System"
        ]
      },
      "Chemistry": {
        title: "Concise Chemistry Middle School",
        publisher: "Selina",
        author: "Dr Sunil Manchanda",
        chapters: [
          "Matter",
          "Physical and Chemical Changes",
          "Elements, Compounds and Mixtures",
          "Atomic Structure",
          "Language of Chemistry",
          "Chemical Reactions",
          "Acids, Bases and Salts",
          "Metals and Non-metals",
          "Air and Water",
          "Carbon and its Compounds"
        ]
      },
      "Biology": {
        title: "Concise Biology Middle School",
        publisher: "Selina",
        author: "Dr BP Pandey",
        chapters: [
          "Cell - The Unit of Life",
          "Tissues",
          "The Flower",
          "Pollination and Fertilization",
          "Reproduction in Plants",
          "The Human Body",
          "Human Diseases",
          "Ecosystems",
          "Food Production",
          "Environmental Protection"
        ]
      },
      "History & Civics": {
        title: "Total History & Civics",
        publisher: "Morning Star",
        author: "Dr Xavier Pinto",
        chapters: [
          "The Ancient World",
          "Rise of Medieval India",
          "The Modern Age",
          "Indian Constitution",
          "Fundamental Rights and Duties",
          "Local Self Government",
          "United Nations",
          "India's Freedom Struggle",
          "World Wars",
          "Current Affairs"
        ]
      },
      "Geography": {
        title: "Total Geography",
        publisher: "Morning Star",
        author: "Dr Xavier Pinto",
        chapters: [
          "Resources",
          "Natural Regions",
          "Climate",
          "Soils",
          "Natural Vegetation",
          "Water Resources",
          "Agriculture",
          "Industries",
          "Transport and Communication",
          "Map Work"
        ]
      },
      "English Literature": {
        title: "Concise English Literature",
        publisher: "Selina",
        author: "Dr John Smith",
        chapters: [
          "Poetry Analysis",
          "Shakespeare's Works",
          "Drama Studies",
          "Short Stories",
          "Novel Study",
          "Literary Devices",
          "Character Analysis",
          "Theme Development",
          "Critical Appreciation",
          "Creative Writing"
        ]
      },
      "English Language": {
        title: "Concise English Language",
        publisher: "Selina",
        author: "Dr Sarah Wilson",
        chapters: [
          "Grammar Fundamentals",
          "Composition Writing",
          "Reading Comprehension",
          "Letter Writing",
          "Essay Writing",
          "Notice and Email Writing",
          "Report Writing",
          "Speech Writing",
          "Story Writing",
          "Vocabulary Enhancement"
        ]
      },
      "Economics": {
        title: "Understanding Economics",
        publisher: "Selina",
        author: "Dr Anita Gupta",
        chapters: [
          "Introduction to Economics",
          "Types of Economy",
          "Market Structure",
          "Money and Banking",
          "Public Finance",
          "National Income",
          "International Trade",
          "Economic Growth",
          "Indian Economy",
          "Current Economic Issues"
        ]
      },
      "Computer Science": {
        title: "Computer Applications",
        publisher: "Selina",
        author: "Dr Sumita Arora",
        chapters: [
          "Computer Fundamentals",
          "Operating Systems",
          "Word Processing",
          "Spreadsheets",
          "Presentation Software",
          "Internet and Web",
          "Introduction to Programming",
          "HTML Basics",
          "Cyber Safety",
          "Latest Trends in Technology"
        ]
      }
    }
  }
};

type FormData = {
  curriculum: string;
  subject: string;
  grade: string;
  difficulty: string;
  format: typeof defaultFormat;
  templateId?: number;
  chapters: string[];
};

const defaultFormat = {
  totalMarks: 100,
  sections: [
    { type: "theory", marks: 60 },
    { type: "problems", marks: 40 }
  ]
};

export default function CreateExam() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<string>("");
  const [availableChapters, setAvailableChapters] = useState<string[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [textbookInfo, setTextbookInfo] = useState<{
    title?: string;
    author?: string;
    publisher?: string;
  }>({});

  const form = useForm<FormData>({
    resolver: zodResolver(insertExamSchema),
    defaultValues: {
      curriculum: CURRICULA[0],
      subject: CURRICULUM_SUBJECTS[CURRICULA[0] as keyof typeof CURRICULUM_SUBJECTS][0],
      grade: GRADES[0],
      difficulty: DIFFICULTIES[0],
      format: defaultFormat,
      chapters: []
    }
  });

  // Update available subjects when curriculum changes
  useEffect(() => {
    const curriculum = form.watch("curriculum");
    const subjects = CURRICULUM_SUBJECTS[curriculum as keyof typeof CURRICULUM_SUBJECTS] || CURRICULUM_SUBJECTS["ICSE"];
    setAvailableSubjects(subjects);

    // Reset subject if not available in new curriculum
    if (!subjects.includes(form.watch("subject"))) {
      form.setValue("subject", subjects[0]);
    }
  }, [form.watch("curriculum")]);

  // Watch for changes in curriculum, grade, and subject to update available chapters
  useEffect(() => {
    const curriculum = form.watch("curriculum");
    const grade = form.watch("grade");
    const subject = form.watch("subject");

    let chaptersData;
    if (["JEE (Main)", "JEE (Advanced)", "NEET", "KVPY", "BITSAT"].includes(curriculum)) {
      chaptersData = TEXTBOOK_CHAPTERS[curriculum as keyof typeof TEXTBOOK_CHAPTERS]?.[subject as keyof typeof TEXTBOOK_CHAPTERS["JEE (Main)"]];
    } else {
      chaptersData = TEXTBOOK_CHAPTERS[curriculum as keyof typeof TEXTBOOK_CHAPTERS]?.[grade as keyof typeof TEXTBOOK_CHAPTERS["ICSE"]]?.[subject as keyof typeof TEXTBOOK_CHAPTERS["ICSE"]["8"]];
    }

    if (chaptersData) {
      setAvailableChapters(chaptersData.chapters);
      setTextbookInfo({
        title: chaptersData.title,
        author: chaptersData.author,
        publisher: chaptersData.publisher
      });
    } else {
      setAvailableChapters([]);
      setTextbookInfo({});
    }
  }, [form.watch("curriculum"), form.watch("grade"), form.watch("subject")]);

  const { data: templates, isLoading: templatesLoading } = useQuery<QuestionTemplate[]>({
    queryKey: ["/api/templates/search", form.watch("curriculum"), form.watch("subject"), form.watch("grade")],
    queryFn: async () => {
      console.log("Fetching templates with params:", {
        curriculum: form.watch("curriculum"),
        subject: form.watch("subject"),
        grade: form.watch("grade")
      });

      const params = new URLSearchParams({
        curriculum: form.watch("curriculum"),
        subject: form.watch("subject"),
        grade: form.watch("grade")
      });

      const response = await fetch(`/api/templates/search?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }
      const data = await response.json();
      console.log("Fetched templates:", data);
      return data;
    },
    enabled: !!form.watch("curriculum") && !!form.watch("subject") && !!form.watch("grade")
  });

  const createExam = useMutation({
    mutationFn: async (data: FormData) => {
      console.log("Creating exam with data:", data);
      const response = await apiRequest("POST", "/api/exams", data);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create exam");
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log("Exam created successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attempts"] });

      toast({
        title: "Success",
        description: "Your exam has been generated successfully"
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      console.error("Error creating exam:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create exam. Please try again.",
        variant: "destructive"
      });
    }
  });

  async function onSubmit(formData: FormData) {
    console.log("Form submission started with values:", formData);
    try {
      setIsGenerating(true);
      toast({
        title: "Generating",
        description: "Creating your exam using curriculum-specific templates...",
      });

      await createExam.mutateAsync(formData);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <PageHeader title="Create New Exam" />
      <Card>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="curriculum"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Curriculum</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select curriculum" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRICULA.map((curr) => (
                          <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableSubjects.map((subject) => (
                          <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GRADES.map((grade) => (
                          <SelectItem key={grade} value={grade}>Grade {grade}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DIFFICULTIES.map((diff) => (
                          <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="chapters"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel>Chapters to Include</FormLabel>
                    {textbookInfo.title && (
                      <div className="text-sm text-muted-foreground mb-4">
                        <p><strong>Textbook:</strong> {textbookInfo.title}</p>
                        <p><strong>Author:</strong> {textbookInfo.author}</p>
                        <p><strong>Publisher:</strong> {textbookInfo.publisher}</p>
                      </div>
                    )}
                    <div className="border rounded-lg p-4 space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        {availableChapters.map((chapter) => (
                          <div key={chapter} className="flex items-center space-x-2">
                            <Checkbox
                              id={chapter}
                              checked={field.value?.includes(chapter)}
                              onCheckedChange={(checked) => {
                                const newValue = checked
                                  ? [...(field.value || []), chapter]
                                  : (field.value || []).filter((c) => c !== chapter);
                                field.onChange(newValue);
                              }}
                            />
                            <Label htmlFor={chapter}>{chapter}</Label>
                          </div>
                        ))}
                      </div>
                      {availableChapters.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center">
                          Please select a curriculum, grade, and subject to see available chapters
                        </p>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="templateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution Template (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const templateId = parseInt(value);
                        field.onChange(templateId === 0 ? undefined : templateId);
                        const template = templates?.find(t => t.id === templateId);
                        if (template) {
                          setSelectedInstitution(template.institution || "");
                        } else {
                          setSelectedInstitution("");
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an institution's format (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">No specific format</SelectItem>
                        {templates?.map((template) => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.institution} - {template.paperFormat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("templateId") && templates?.find(t => t.id === form.watch("templateId")) && (
                <Card className="bg-secondary/10">
                  <CardContent className="pt-4">
                    <h3 className="font-medium mb-2">Template Details</h3>
                    {(() => {
                      const template = templates.find(t => t.id === form.watch("templateId"));
                      const metadata = template?.formatMetadata as any;
                      return (
                        <div className="text-sm space-y-2">
                          <p><strong>Institution:</strong> {template?.institution}</p>
                          <p><strong>Format:</strong> {template?.paperFormat}</p>
                          {metadata?.totalMarks && (
                            <p><strong>Total Marks:</strong> {metadata.totalMarks}</p>
                          )}
                          {metadata?.duration && (
                            <p><strong>Duration:</strong> {metadata.duration} minutes</p>
                          )}
                          {metadata?.specialInstructions && (
                            <div>
                              <strong>Special Instructions:</strong>
                              <ul className="list-disc pl-4 mt-1">
                                {metadata.specialInstructions.map((instruction: string, i: number) => (
                                  <li key={i}>{instruction}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isGenerating}
              >
                {isGenerating ? "Generating exam..." : "Generate Exam"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}