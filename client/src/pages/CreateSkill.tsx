import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Code,
  FileText,
} from "lucide-react";
import { Link } from "wouter";

const categories = [
  { value: "development", label: "Development" },
  { value: "data_analysis", label: "Data Analysis" },
  { value: "business", label: "Business" },
  { value: "communication", label: "Communication" },
  { value: "creative", label: "Creative" },
  { value: "productivity", label: "Productivity" },
  { value: "security", label: "Security" },
  { value: "other", label: "Other" },
];

const scriptLanguages = [
  { value: "python", label: "Python" },
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "bash", label: "Bash" },
  { value: "other", label: "Other" },
];

const templateFormats = [
  { value: "markdown", label: "Markdown" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "text", label: "Plain Text" },
  { value: "other", label: "Other" },
];

interface Script {
  name: string;
  language: "python" | "typescript" | "javascript" | "bash" | "other";
  content: string;
  description: string;
}

interface Template {
  name: string;
  format: "markdown" | "json" | "yaml" | "text" | "other";
  content: string;
  description: string;
}

export default function CreateSkill() {
  const [, navigate] = useLocation();
  
  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("development");
  const [content, setContent] = useState("");
  const [whenToUse, setWhenToUse] = useState("");
  const [instructions, setInstructions] = useState("");
  const [examples, setExamples] = useState<string[]>([""]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  const createMutation = trpc.skills.create.useMutation({
    onSuccess: async (skill) => {
      // Add scripts
      for (const script of scripts) {
        if (script.name && script.content) {
          await addScriptMutation.mutateAsync({
            skillId: skill.id,
            ...script,
          });
        }
      }
      // Add templates
      for (const template of templates) {
        if (template.name && template.content) {
          await addTemplateMutation.mutateAsync({
            skillId: skill.id,
            ...template,
          });
        }
      }
      toast.success("Skill created successfully!");
      navigate(`/skills/${skill.slug}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const addScriptMutation = trpc.skills.addScript.useMutation();
  const addTemplateMutation = trpc.skills.addTemplate.useMutation();

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    const generatedSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setSlug(generatedSlug);
  };

  // Examples management
  const addExample = () => setExamples([...examples, ""]);
  const removeExample = (index: number) => {
    setExamples(examples.filter((_, i) => i !== index));
  };
  const updateExample = (index: number, value: string) => {
    const newExamples = [...examples];
    newExamples[index] = value;
    setExamples(newExamples);
  };

  // Tags management
  const addTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput("");
    }
  };
  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // Scripts management
  const addScript = () => {
    setScripts([...scripts, { name: "", language: "python", content: "", description: "" }]);
  };
  const removeScript = (index: number) => {
    setScripts(scripts.filter((_, i) => i !== index));
  };
  const updateScript = (index: number, field: keyof Script, value: string) => {
    const newScripts = [...scripts];
    (newScripts[index] as any)[field] = value;
    setScripts(newScripts);
  };

  // Templates management
  const addTemplate = () => {
    setTemplates([...templates, { name: "", format: "markdown", content: "", description: "" }]);
  };
  const removeTemplate = (index: number) => {
    setTemplates(templates.filter((_, i) => i !== index));
  };
  const updateTemplate = (index: number, field: keyof Template, value: string) => {
    const newTemplates = [...templates];
    (newTemplates[index] as any)[field] = value;
    setTemplates(newTemplates);
  };

  const handleSubmit = () => {
    if (!name || !slug || !description || !content) {
      toast.error("Please fill in all required fields");
      return;
    }

    createMutation.mutate({
      name,
      slug,
      description,
      category: category as any,
      content,
      whenToUse: whenToUse || undefined,
      instructions: instructions || undefined,
      examples: JSON.stringify(examples.filter((e) => e)),
      tags: JSON.stringify(tags),
      isPublic,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/skills/my">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Skill</h1>
            <p className="text-muted-foreground mt-1">
              Define a reusable skill that can be used by your AI agent
            </p>
          </div>
        </div>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Give your skill a name and description
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Code Review Assistant"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  placeholder="e.g., code-review-assistant"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="A brief description of what this skill does..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                  <span className="text-sm text-muted-foreground">
                    {isPublic ? "Public - visible to all users" : "Private - only you can see it"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>Skill Content</CardTitle>
            <CardDescription>
              Define what this skill does and how to use it
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">Main Content *</Label>
              <Textarea
                id="content"
                placeholder="The main content of your skill. This will be shown to the AI agent when the skill is active..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whenToUse">When to Use</Label>
              <Textarea
                id="whenToUse"
                placeholder="Describe when this skill should be used..."
                value={whenToUse}
                onChange={(e) => setWhenToUse(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="Step-by-step instructions for using this skill..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={5}
                className="font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Examples</CardTitle>
            <CardDescription>
              Provide examples of when to use this skill
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {examples.map((example, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`Example ${index + 1}`}
                  value={example}
                  onChange={(e) => updateExample(index, e.target.value)}
                />
                {examples.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExample(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" onClick={addExample}>
              <Plus className="h-4 w-4 mr-2" />
              Add Example
            </Button>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
            <CardDescription>
              Add tags to help users find your skill
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-sm"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-destructive"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              />
              <Button variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Scripts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Scripts (Optional)
            </CardTitle>
            <CardDescription>
              Add helper scripts that can be used with this skill
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {scripts.map((script, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">Script {index + 1}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeScript(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="Script name"
                      value={script.name}
                      onChange={(e) => updateScript(index, "name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select
                      value={script.language}
                      onValueChange={(v) => updateScript(index, "language", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {scriptLanguages.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="What does this script do?"
                    value={script.description}
                    onChange={(e) => updateScript(index, "description", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    placeholder="Script content..."
                    value={script.content}
                    onChange={(e) => updateScript(index, "content", e.target.value)}
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addScript}>
              <Plus className="h-4 w-4 mr-2" />
              Add Script
            </Button>
          </CardContent>
        </Card>

        {/* Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Templates (Optional)
            </CardTitle>
            <CardDescription>
              Add document templates that can be used with this skill
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {templates.map((template, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">Template {index + 1}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTemplate(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="Template name"
                      value={template.name}
                      onChange={(e) => updateTemplate(index, "name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Format</Label>
                    <Select
                      value={template.format}
                      onValueChange={(v) => updateTemplate(index, "format", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templateFormats.map((fmt) => (
                          <SelectItem key={fmt.value} value={fmt.value}>
                            {fmt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="What is this template for?"
                    value={template.description}
                    onChange={(e) => updateTemplate(index, "description", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    placeholder="Template content..."
                    value={template.content}
                    onChange={(e) => updateTemplate(index, "content", e.target.value)}
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addTemplate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Template
            </Button>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Link href="/skills/my">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {createMutation.isPending ? "Creating..." : "Create Skill"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
