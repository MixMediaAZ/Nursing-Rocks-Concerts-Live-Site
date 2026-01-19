import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Briefcase, Building2, Calendar, Clock, Filter, MapPin, Search, 
  Star, X, ChevronRight, Stethoscope, Users, Info, Sparkles
} from "lucide-react";
import { jobListings } from "@shared/schema";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Nursing specialties
const NURSING_SPECIALTIES = [
  { value: "critical-care", label: "Critical Care" },
  { value: "emergency", label: "Emergency" },
  { value: "medical-surgical", label: "Medical-Surgical" },
  { value: "pediatric", label: "Pediatric" },
  { value: "psychiatric", label: "Psychiatric" },
  { value: "obstetric", label: "Obstetric" },
  { value: "oncology", label: "Oncology" },
  { value: "geriatric", label: "Geriatric" },
  { value: "neonatal", label: "Neonatal" },
  { value: "operating-room", label: "Operating Room" },
  { value: "post-anesthesia", label: "Post-Anesthesia" },
  { value: "telemetry", label: "Telemetry" },
];

// Experience levels
const EXPERIENCE_LEVELS = [
  { value: "entry", label: "Entry Level (0-2 years)" },
  { value: "mid", label: "Mid Level (3-5 years)" },
  { value: "senior", label: "Senior Level (6+ years)" },
];

// Job types
const JOB_TYPES = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "per-diem", label: "Per Diem" },
  { value: "travel", label: "Travel" },
];

// Work arrangements
const WORK_ARRANGEMENTS = [
  { value: "on-site", label: "On-site" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];

// Shift types
const SHIFT_TYPES = [
  { value: "day", label: "Day" },
  { value: "night", label: "Night" },
  { value: "rotating", label: "Rotating" },
  { value: "weekend", label: "Weekend" },
];

// Search form schema
const searchSchema = z.object({
  keywords: z.string().optional(),
  location: z.string().optional(),
  specialty: z.string().optional(),
  experienceLevel: z.string().optional(),
  jobType: z.string().optional(),
  workArrangement: z.string().optional(),
  shiftType: z.string().optional(),
  minSalary: z.number().optional(),
});

type SearchFormValues = z.infer<typeof searchSchema>;

export default function JobsPage() {
  const [, navigate] = useLocation();
  const [searchValues, setSearchValues] = useState<SearchFormValues>({});
  const [sortBy, setSortBy] = useState<string>("relevance");
  const [showFilters, setShowFilters] = useState(false);

  // Form for search filters
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      keywords: "",
      location: "",
      specialty: "",
      experienceLevel: "",
      jobType: "",
      workArrangement: "",
      shiftType: "",
      minSalary: undefined,
    },
  });

  // Fetch job listings with filters
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['/api/jobs', searchValues, sortBy],
    enabled: true,
    select: (data) => data || [],
  });

  const { data: featuredJobs, isLoading: featuredLoading } = useQuery({
    queryKey: ['/api/jobs/featured'],
    enabled: true,
    select: (data) => data || [],
  });

  // Handle search form submission
  function onSubmit(values: SearchFormValues) {
    setSearchValues(values);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center text-center mb-8 border border-gray-300 rounded-lg p-6 bg-white/10 shadow-sm">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Nursing Rocks! Jobs Board</h1>
        <p className="text-muted-foreground mb-6 max-w-2xl">
          Find your dream nursing job and connect with top healthcare employers. 
          Exclusive opportunities for verified nursing professionals.
        </p>
        <div className="w-full max-w-3xl">
          <Card className="border-2 border-primary/20">
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <FormField
                      control={form.control}
                      name="keywords"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                              <Input
                                placeholder="Job title or keywords"
                                {...field}
                                className="pl-9"
                              />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                              <Input
                                placeholder="Location or remote"
                                {...field}
                                className="pl-9"
                              />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2">
                      <Button type="submit">Search Jobs</Button>
                      <Sheet open={showFilters} onOpenChange={setShowFilters}>
                        <SheetTrigger asChild>
                          <Button variant="outline" className="px-3">
                            <Filter className="h-4 w-4" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                          <SheetHeader className="mb-4">
                            <SheetTitle>Filter Jobs</SheetTitle>
                            <SheetDescription>
                              Refine your job search with these filters
                            </SheetDescription>
                          </SheetHeader>
                          <div className="grid gap-6 py-4">
                            <div className="space-y-4">
                              <h3 className="font-medium flex items-center">
                                <Stethoscope className="h-4 w-4 mr-2" />
                                Nursing Specialty
                              </h3>
                              <FormField
                                control={form.control}
                                name="specialty"
                                render={({ field }) => (
                                  <FormItem>
                                    <Select
                                      onValueChange={field.onChange}
                                      value={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select specialty" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {NURSING_SPECIALTIES.map((specialty) => (
                                          <SelectItem
                                            key={specialty.value}
                                            value={specialty.value}
                                          >
                                            {specialty.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </FormItem>
                                )}
                              />
                            </div>
                            <Separator />
                            <div className="space-y-4">
                              <h3 className="font-medium flex items-center">
                                <Users className="h-4 w-4 mr-2" />
                                Experience Level
                              </h3>
                              <FormField
                                control={form.control}
                                name="experienceLevel"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <RadioGroup
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        className="flex flex-col space-y-1"
                                      >
                                        {EXPERIENCE_LEVELS.map((level) => (
                                          <div
                                            key={level.value}
                                            className="flex items-center space-x-2"
                                          >
                                            <RadioGroupItem
                                              value={level.value}
                                              id={`level-${level.value}`}
                                            />
                                            <label
                                              htmlFor={`level-${level.value}`}
                                              className="text-sm font-normal"
                                            >
                                              {level.label}
                                            </label>
                                          </div>
                                        ))}
                                      </RadioGroup>
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                            <Separator />
                            <div className="space-y-4">
                              <h3 className="font-medium flex items-center">
                                <Briefcase className="h-4 w-4 mr-2" />
                                Job Type
                              </h3>
                              <FormField
                                control={form.control}
                                name="jobType"
                                render={({ field }) => (
                                  <FormItem>
                                    <Select
                                      onValueChange={field.onChange}
                                      value={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select job type" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {JOB_TYPES.map((type) => (
                                          <SelectItem
                                            key={type.value}
                                            value={type.value}
                                          >
                                            {type.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </FormItem>
                                )}
                              />
                            </div>
                            <Separator />
                            <div className="space-y-4">
                              <h3 className="font-medium flex items-center">
                                <Building2 className="h-4 w-4 mr-2" />
                                Work Arrangement
                              </h3>
                              <FormField
                                control={form.control}
                                name="workArrangement"
                                render={({ field }) => (
                                  <FormItem className="space-y-2">
                                    <FormControl>
                                      <ToggleGroup
                                        type="single"
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        className="flex flex-wrap gap-2"
                                      >
                                        {WORK_ARRANGEMENTS.map((arrangement) => (
                                          <ToggleGroupItem
                                            key={arrangement.value}
                                            value={arrangement.value}
                                            aria-label={arrangement.label}
                                            className="px-3 py-2 bg-background border-muted data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                                          >
                                            {arrangement.label}
                                          </ToggleGroupItem>
                                        ))}
                                      </ToggleGroup>
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                            <Separator />
                            <div className="space-y-4">
                              <h3 className="font-medium flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                Shift Type
                              </h3>
                              <FormField
                                control={form.control}
                                name="shiftType"
                                render={({ field }) => (
                                  <FormItem>
                                    <Select
                                      onValueChange={field.onChange}
                                      value={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select shift type" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {SHIFT_TYPES.map((shift) => (
                                          <SelectItem
                                            key={shift.value}
                                            value={shift.value}
                                          >
                                            {shift.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </FormItem>
                                )}
                              />
                            </div>
                            <Separator />
                            <div className="space-y-4">
                              <h3 className="font-medium flex items-center justify-between">
                                <span className="flex items-center">
                                  <Info className="h-4 w-4 mr-2" />
                                  Minimum Salary
                                </span>
                                {form.watch("minSalary") && (
                                  <Badge variant="outline" className="font-mono">
                                    ${form.watch("minSalary")?.toLocaleString()}
                                  </Badge>
                                )}
                              </h3>
                              <FormField
                                control={form.control}
                                name="minSalary"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Slider
                                        onValueChange={(values) => {
                                          field.onChange(values[0]);
                                        }}
                                        value={field.value ? [field.value] : [0]}
                                        max={200000}
                                        step={5000}
                                        className="py-4"
                                      />
                                    </FormControl>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                      <span>$0</span>
                                      <span>$50K</span>
                                      <span>$100K</span>
                                      <span>$150K</span>
                                      <span>$200K+</span>
                                    </div>
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="flex flex-col gap-2 mt-4">
                              <Button
                                type="submit"
                                onClick={() => {
                                  form.handleSubmit(onSubmit)();
                                  setShowFilters(false);
                                }}
                              >
                                Apply Filters
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  form.reset();
                                  setSearchValues({});
                                }}
                              >
                                Clear Filters
                              </Button>
                            </div>
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="hidden lg:block lg:col-span-3">
          <div className="sticky top-8 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form className="space-y-6">
                    <Accordion type="multiple" className="w-full" defaultValue={["specialty", "experience"]}>
                      <AccordionItem value="specialty">
                        <AccordionTrigger className="text-sm font-medium">
                          Nursing Specialty
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pt-1">
                            <FormField
                              control={form.control}
                              name="specialty"
                              render={({ field }) => (
                                <FormItem>
                                  <Select
                                    onValueChange={(value) => {
                                      field.onChange(value);
                                      form.handleSubmit(onSubmit)();
                                    }}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select specialty" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {NURSING_SPECIALTIES.map((specialty) => (
                                        <SelectItem
                                          key={specialty.value}
                                          value={specialty.value}
                                        >
                                          {specialty.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="experience">
                        <AccordionTrigger className="text-sm font-medium">
                          Experience Level
                        </AccordionTrigger>
                        <AccordionContent>
                          <FormField
                            control={form.control}
                            name="experienceLevel"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={(value) => {
                                      field.onChange(value);
                                      form.handleSubmit(onSubmit)();
                                    }}
                                    value={field.value}
                                    className="flex flex-col space-y-1"
                                  >
                                    {EXPERIENCE_LEVELS.map((level) => (
                                      <div
                                        key={level.value}
                                        className="flex items-center space-x-2"
                                      >
                                        <RadioGroupItem
                                          value={level.value}
                                          id={`desktop-level-${level.value}`}
                                        />
                                        <label
                                          htmlFor={`desktop-level-${level.value}`}
                                          className="text-sm font-normal"
                                        >
                                          {level.label}
                                        </label>
                                      </div>
                                    ))}
                                  </RadioGroup>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="jobType">
                        <AccordionTrigger className="text-sm font-medium">
                          Job Type
                        </AccordionTrigger>
                        <AccordionContent>
                          <FormField
                            control={form.control}
                            name="jobType"
                            render={({ field }) => (
                              <FormItem>
                                <Select
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    form.handleSubmit(onSubmit)();
                                  }}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select job type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {JOB_TYPES.map((type) => (
                                      <SelectItem
                                        key={type.value}
                                        value={type.value}
                                      >
                                        {type.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="workArrangement">
                        <AccordionTrigger className="text-sm font-medium">
                          Work Arrangement
                        </AccordionTrigger>
                        <AccordionContent>
                          <FormField
                            control={form.control}
                            name="workArrangement"
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormControl>
                                  <div className="flex flex-col gap-2">
                                    {WORK_ARRANGEMENTS.map((arrangement) => (
                                      <div
                                        key={arrangement.value}
                                        className="flex items-center space-x-2"
                                      >
                                        <Checkbox
                                          id={`arrangement-${arrangement.value}`}
                                          checked={field.value === arrangement.value}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              field.onChange(arrangement.value);
                                              form.handleSubmit(onSubmit)();
                                            } else {
                                              field.onChange("");
                                              form.handleSubmit(onSubmit)();
                                            }
                                          }}
                                        />
                                        <label
                                          htmlFor={`arrangement-${arrangement.value}`}
                                          className="text-sm font-normal"
                                        >
                                          {arrangement.label}
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="shiftType">
                        <AccordionTrigger className="text-sm font-medium">
                          Shift Type
                        </AccordionTrigger>
                        <AccordionContent>
                          <FormField
                            control={form.control}
                            name="shiftType"
                            render={({ field }) => (
                              <FormItem>
                                <Select
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    form.handleSubmit(onSubmit)();
                                  }}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select shift type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {SHIFT_TYPES.map((shift) => (
                                      <SelectItem
                                        key={shift.value}
                                        value={shift.value}
                                      >
                                        {shift.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="salary">
                        <AccordionTrigger className="text-sm font-medium">
                          Minimum Salary
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pt-2 px-1">
                            <FormField
                              control={form.control}
                              name="minSalary"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Slider
                                      onValueChange={(values) => {
                                        field.onChange(values[0]);
                                        // Don't auto-submit on slider change
                                      }}
                                      onValueCommit={() => {
                                        form.handleSubmit(onSubmit)();
                                      }}
                                      value={field.value ? [field.value] : [0]}
                                      max={200000}
                                      step={5000}
                                      className="py-4"
                                    />
                                  </FormControl>
                                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                    <span>$0</span>
                                    <span>$100K</span>
                                    <span>$200K+</span>
                                  </div>
                                  {field.value ? (
                                    <div className="text-center mt-2">
                                      <Badge variant="outline" className="font-mono">
                                        ${field.value.toLocaleString()}
                                      </Badge>
                                    </div>
                                  ) : null}
                                </FormItem>
                              )}
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <div className="space-y-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          form.reset();
                          setSearchValues({});
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear All Filters
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="lg:col-span-9">
          <div className="flex items-center justify-between mb-6">
            <div>
              {isLoading ? (
                <Skeleton className="h-9 w-40" />
              ) : (
                <h2 className="text-xl font-semibold">
                  {jobs?.length || 0} Nursing Jobs
                  {Object.keys(searchValues).length > 0
                    ? " matching your filters"
                    : ""}
                </h2>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden md:inline-block">
                Sort by:
              </span>
              <Select
                value={sortBy}
                onValueChange={setSortBy}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="date-desc">Newest First</SelectItem>
                  <SelectItem value="date-asc">Oldest First</SelectItem>
                  <SelectItem value="salary-desc">Highest Salary</SelectItem>
                  <SelectItem value="salary-asc">Lowest Salary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-6 mb-8">
            {/* Featured jobs section */}
            {featuredLoading ? (
              <div className="grid grid-cols-1 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : featuredJobs && Array.isArray(featuredJobs) && featuredJobs.length > 0 ? (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center mb-4">
                  <Sparkles className="h-5 w-5 text-primary mr-2" />
                  <h3 className="font-semibold">Featured Opportunities</h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {featuredJobs.map((job: any) => (
                    <FeaturedJobCard key={job.id} job={job} />
                  ))}
                </div>
              </div>
            ) : null}

            {/* Search results */}
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <JobCardSkeleton key={i} />
                ))}
              </div>
            ) : jobs && Array.isArray(jobs) && jobs.length > 0 ? (
              <div className="space-y-4">
                {jobs.map((job: any) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg bg-background">
                <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-muted">
                  <Briefcase className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {Object.keys(searchValues).length > 0
                    ? "Try adjusting your search filters to see more results."
                    : "There are no job listings available at the moment. Please check back later."}
                </p>
                {Object.keys(searchValues).length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      form.reset();
                      setSearchValues({});
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface JobCardProps {
  job: {
    id: number;
    title: string;
    employer_id: number;
    employer?: {
      name: string;
      logo_url: string | null;
    };
    description: string;
    responsibilities: string | null;
    requirements: string | null;
    benefits: string | null;
    location: string;
    job_type: string;
    work_arrangement: string;
    specialty: string;
    experience_level: string;
    education_required: string | null;
    certification_required: string[] | null;
    shift_type: string | null;
    salary_min: number | null;
    salary_max: number | null;
    salary_period: string;
    application_url: string | null;
    contact_email: string | null;
    is_featured: boolean;
    is_active: boolean;
    posted_date: string;
    views_count: number;
    applications_count: number;
    has_applied?: boolean;
    is_saved?: boolean;
  };
}

const FeaturedJobCard = ({ job }: JobCardProps) => {
  return (
    <Card className="bg-primary-foreground border-primary/20 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-4">
            <div className="hidden md:flex h-12 w-12 rounded overflow-hidden bg-primary/10 items-center justify-center">
              {job.employer?.logo_url ? (
                <img
                  src={job.employer?.logo_url}
                  alt={job.employer?.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building2 className="h-6 w-6 text-primary/60" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                <Link href={`/jobs/${job.id}`}>{job.title}</Link>
              </h3>
              <div className="flex items-center text-sm text-muted-foreground mb-2">
                <span className="font-medium text-foreground">
                  {job.employer?.name}
                </span>
                <span className="mx-2">•</span>
                <span className="flex items-center">
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  {job.location}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {job.job_type}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {job.specialty}
                </Badge>
                <Badge variant="outline" className="text-xs bg-primary/5 border-primary/20 text-primary-foreground">
                  <Star className="h-3 w-3 mr-1 fill-primary text-primary" />
                  Featured
                </Badge>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-lg">
              {job.salary_min && job.salary_max
                ? `$${(job.salary_min / 1000).toFixed(0)}k - $${(job.salary_max / 1000).toFixed(0)}k`
                : job.salary_min
                ? `$${(job.salary_min / 1000).toFixed(0)}k+`
                : "Competitive"}
            </div>
            <div className="text-xs text-muted-foreground">
              {job.salary_period || "per year"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const JobCard = ({ job }: JobCardProps) => {
  const isNew = job.posted_date && 
    new Date(job.posted_date).getTime() > 
    new Date().getTime() - 3 * 24 * 60 * 60 * 1000; // 3 days old or less

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-4">
            <div className="hidden md:flex h-12 w-12 rounded overflow-hidden bg-muted items-center justify-center">
              {job.employer?.logo_url ? (
                <img
                  src={job.employer?.logo_url}
                  alt={job.employer?.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building2 className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold hover:text-primary transition-colors">
                  <Link href={`/jobs/${job.id}`}>{job.title}</Link>
                </h3>
                {isNew && (
                  <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
                    New
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center text-sm text-muted-foreground my-1 gap-x-2 gap-y-1">
                <span className="font-medium text-foreground">
                  {job.employer?.name}
                </span>
                <span className="flex items-center">
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  {job.location}
                </span>
                {job.work_arrangement && (
                  <span className="flex items-center">
                    <Building2 className="h-3.5 w-3.5 mr-1" />
                    {job.work_arrangement}
                  </span>
                )}
                {job.shift_type && (
                  <span className="flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    {job.shift_type} Shift
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {job.job_type}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {job.specialty}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {job.experience_level}
                </Badge>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-primary">
              {job.salary_min && job.salary_max
                ? `$${(job.salary_min / 1000).toFixed(0)}k - $${(job.salary_max / 1000).toFixed(0)}k`
                : job.salary_min
                ? `$${(job.salary_min / 1000).toFixed(0)}k+`
                : "Competitive"}
            </div>
            <div className="text-xs text-muted-foreground">
              {job.salary_period || "per year"}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {job.posted_date ? (
                <span className="flex items-center justify-end">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(job.posted_date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="mt-3 text-sm text-muted-foreground line-clamp-2">
          {job.description}
        </div>
      </CardContent>
      <CardFooter className="px-4 pb-4 pt-0 flex justify-between items-center">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/jobs/${job.id}`}>
              View Details
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="hidden md:flex">
            <Star className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {job.applications_count === 1
            ? "1 applicant"
            : job.applications_count > 1
            ? `${job.applications_count} applicants`
            : "Be the first to apply!"}
        </div>
      </CardFooter>
    </Card>
  );
};

const JobCardSkeleton = () => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex gap-4">
            <Skeleton className="h-12 w-12 rounded" />
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-40 mb-2" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          </div>
          <div className="text-right">
            <Skeleton className="h-6 w-20 mb-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <Skeleton className="h-4 w-full mt-4" />
        <Skeleton className="h-4 w-4/5 mt-2" />
      </CardContent>
      <CardFooter className="px-4 pb-4 pt-0">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-20" />
        </div>
      </CardFooter>
    </Card>
  );
};