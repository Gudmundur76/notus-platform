/**
 * Built-in Skills
 * Pre-configured skills imported from awesome-claude-skills repository
 * These skills are automatically available to all users
 */

import { createSkill, getSkillBySlug, addSkillScript, addSkillTemplate } from "./skills";

export interface BuiltInSkillData {
  name: string;
  slug: string;
  description: string;
  category: "development" | "data_analysis" | "business" | "communication" | "creative" | "productivity" | "security" | "other";
  content: string;
  whenToUse: string;
  instructions: string;
  examples: string[];
  tags: string[];
  scripts?: { name: string; language: "python" | "typescript" | "javascript" | "bash" | "other"; content: string; description: string }[];
  templates?: { name: string; content: string; format: "markdown" | "json" | "yaml" | "text" | "other"; description: string }[];
}

/**
 * Built-in skills data
 */
export const builtInSkillsData: BuiltInSkillData[] = [
  // ============================================
  // DEVELOPMENT SKILLS
  // ============================================
  {
    name: "MCP Builder",
    slug: "mcp-builder",
    description: "Guide for creating high-quality MCP (Model Context Protocol) servers that enable LLMs to interact with external services through well-designed tools.",
    category: "development",
    whenToUse: "Use when building MCP servers to integrate external APIs or services, whether in Python (FastMCP) or Node/TypeScript (MCP SDK).",
    content: `# MCP Server Development Guide

## Overview
Create high-quality MCP servers that enable LLMs to effectively interact with external services.

## High-Level Workflow

### Phase 1: Deep Research and Planning
- Build for Workflows, Not Just API Endpoints
- Optimize for Limited Context
- Design Actionable Error Messages

### Phase 2: Implementation
- Set Up Project Structure
- Implement Core Infrastructure First
- Build tools systematically with proper validation

### Phase 3: Testing
- Unit tests for each tool
- Integration tests with real API
- Edge case testing

### Phase 4: Documentation
- Clear README with setup instructions
- Tool descriptions and examples`,
    instructions: `When building an MCP server:

1. Research Phase - Study the MCP protocol documentation
2. Implementation Phase - Set up project structure, implement shared utilities
3. Testing Phase - Write comprehensive tests
4. Documentation Phase - Write clear setup instructions`,
    examples: [
      "Build an MCP server for GitHub API integration",
      "Create an MCP server for Slack messaging",
      "Develop an MCP server for database queries",
    ],
    tags: ["mcp", "api", "integration", "typescript", "python"],
  },

  {
    name: "Test-Driven Development",
    slug: "test-driven-development",
    description: "Implement features using TDD methodology - write tests first, then implement code to pass them.",
    category: "development",
    whenToUse: "Use when implementing any feature or bugfix, before writing implementation code.",
    content: `# Test-Driven Development (TDD) Skill

## The TDD Cycle

### 1. Red Phase
Write a failing test that defines the expected behavior.

### 2. Green Phase
Write the minimum code necessary to make the test pass.

### 3. Refactor Phase
Improve the code while keeping tests green.

## Best Practices
- Write one test at a time
- Keep tests small and focused
- Test behavior, not implementation
- Use descriptive test names`,
    instructions: `Follow the TDD cycle:
1. Write a Failing Test - Define expected behavior
2. Make It Pass - Write minimum code to pass
3. Refactor - Improve code quality
4. Repeat - Move to next feature`,
    examples: [
      "Implement a user authentication system using TDD",
      "Build a shopping cart with TDD approach",
      "Create an API endpoint with test-first methodology",
    ],
    tags: ["tdd", "testing", "development", "best-practices"],
  },

  {
    name: "Software Architecture",
    slug: "software-architecture",
    description: "Implement design patterns including Clean Architecture, SOLID principles, and comprehensive software design best practices.",
    category: "development",
    whenToUse: "Use when designing system architecture, implementing design patterns, or refactoring code for better maintainability.",
    content: `# Software Architecture Skill

## SOLID Principles
- Single Responsibility Principle
- Open/Closed Principle
- Liskov Substitution Principle
- Interface Segregation Principle
- Dependency Inversion Principle

## Clean Architecture Layers
1. Entities - Enterprise business rules
2. Use Cases - Application business rules
3. Interface Adapters - Controllers, presenters, gateways
4. Frameworks & Drivers - External tools and frameworks

## Design Patterns
- Creational: Factory, Builder, Singleton
- Structural: Adapter, Decorator, Facade
- Behavioral: Observer, Strategy, Command`,
    instructions: `When designing architecture:
1. Identify Requirements - Functional and non-functional
2. Apply SOLID Principles - Single responsibility per class
3. Choose Appropriate Patterns - Match pattern to problem
4. Layer Your Application - Separate concerns`,
    examples: [
      "Design a microservices architecture for an e-commerce platform",
      "Refactor a monolithic application using Clean Architecture",
      "Implement the Repository pattern for data access",
    ],
    tags: ["architecture", "solid", "design-patterns", "clean-code"],
  },

  {
    name: "Subagent-Driven Development",
    slug: "subagent-driven-development",
    description: "Dispatch independent subagents for individual tasks with code review checkpoints between iterations for rapid, controlled development.",
    category: "development",
    whenToUse: "Use when working on complex features that can be broken down into independent subtasks, or when you need parallel development with quality gates.",
    content: `# Subagent-Driven Development

## Workflow
1. Task Decomposition - Identify independent subtasks
2. Subagent Dispatch - Assign to specialized agents
3. Code Review Checkpoints - Review completed subtasks
4. Integration - Merge and validate

## Benefits
- Parallel development
- Specialized focus
- Quality gates
- Faster iteration`,
    instructions: `When using subagent-driven development:
1. Decompose the Task - Break into independent units
2. Dispatch Subagents - Assign specialized tasks
3. Review and Iterate - Check completed work
4. Integrate and Validate - Merge all components`,
    examples: [
      "Build a full-stack feature with separate frontend and backend subagents",
      "Develop a plugin system with multiple independent plugins",
      "Create a data pipeline with specialized processing stages",
    ],
    tags: ["agents", "parallel", "development", "workflow"],
  },

  {
    name: "Webapp Testing",
    slug: "webapp-testing",
    description: "Test local web applications using Playwright for verifying frontend functionality, debugging UI behavior, and capturing screenshots.",
    category: "development",
    whenToUse: "Use when testing web applications, verifying UI functionality, or debugging frontend issues.",
    content: `# Webapp Testing with Playwright

## Capabilities
- Browser Automation - Navigate, click, fill forms
- Assertions - Text verification, element visibility
- Debugging - Screenshots, console logging

## Best Practices
- Use data-testid attributes
- Wait for elements properly
- Handle async operations
- Clean up test state`,
    instructions: `When testing web applications:
1. Set Up Test Environment - Install Playwright
2. Write Test Cases - Navigate and interact
3. Debug Issues - Capture screenshots
4. Maintain Tests - Keep selectors updated`,
    examples: [
      "Test a login flow with form validation",
      "Verify a shopping cart checkout process",
      "Debug a responsive layout issue",
    ],
    tags: ["testing", "playwright", "automation", "frontend"],
  },

  {
    name: "Prompt Engineering",
    slug: "prompt-engineering",
    description: "Apply well-known prompt engineering techniques and patterns, including Anthropic best practices and agent persuasion principles.",
    category: "development",
    whenToUse: "Use when crafting prompts for LLMs, designing agent instructions, or optimizing AI interactions.",
    content: `# Prompt Engineering Skill

## Core Principles
- Clarity - Be specific and unambiguous
- Context - Provide relevant background
- Structure - Use consistent formatting

## Techniques
- Few-Shot Learning - Provide examples
- Chain of Thought - Explain reasoning step by step
- Role Playing - Assign specific personas
- Constraints - Set clear boundaries`,
    instructions: `When engineering prompts:
1. Define the Goal - What output do you need?
2. Craft the Prompt - Be specific and clear
3. Test and Iterate - Try different variations
4. Optimize - Reduce token usage`,
    examples: [
      "Design a prompt for code review feedback",
      "Create a prompt for data extraction from documents",
      "Build a conversational agent prompt",
    ],
    tags: ["prompts", "llm", "ai", "optimization"],
  },

  // ============================================
  // BUSINESS SKILLS
  // ============================================
  {
    name: "Lead Research Assistant",
    slug: "lead-research-assistant",
    description: "Identify and qualify high-quality leads by analyzing your product, searching for target companies, and providing actionable outreach strategies.",
    category: "business",
    whenToUse: "Use when researching potential customers, qualifying leads, or developing outreach strategies.",
    content: `# Lead Research Assistant

## Process
1. Product Analysis - Understand value proposition
2. Lead Identification - Search for target companies
3. Lead Qualification - Assess fit and timing
4. Outreach Strategy - Personalize messaging

## Deliverables
- Qualified lead list
- Company profiles
- Contact information
- Outreach templates`,
    instructions: `When researching leads:
1. Understand the Product - What problem does it solve?
2. Identify Targets - Define criteria and search
3. Qualify Leads - Research each company
4. Develop Outreach - Personalize messages`,
    examples: [
      "Research SaaS companies for a B2B marketing tool",
      "Find e-commerce businesses for a logistics solution",
      "Identify healthcare organizations for a compliance platform",
    ],
    tags: ["sales", "leads", "research", "outreach"],
  },

  {
    name: "Content Research Writer",
    slug: "content-research-writer",
    description: "Assist in writing high-quality content by conducting research, adding citations, improving hooks, and providing section-by-section feedback.",
    category: "communication",
    whenToUse: "Use when writing articles, blog posts, or any content that requires research and citations.",
    content: `# Content Research Writer

## Process
1. Topic Research - Gather and verify sources
2. Outline Creation - Structure content
3. Writing - Craft compelling hooks
4. Review - Check accuracy and flow

## Quality Standards
- Accurate information
- Proper citations
- Engaging style
- Clear structure`,
    instructions: `When writing content:
1. Research Thoroughly - Find credible sources
2. Create Structure - Outline main points
3. Write Engagingly - Start with strong hooks
4. Review and Polish - Check facts and citations`,
    examples: [
      "Write a technical blog post about AI trends",
      "Create a research report on market dynamics",
      "Develop a whitepaper on industry best practices",
    ],
    tags: ["writing", "research", "content", "citations"],
  },

  // ============================================
  // PRODUCTIVITY SKILLS
  // ============================================
  {
    name: "File Organizer",
    slug: "file-organizer",
    description: "Organize files and folders systematically with consistent naming conventions and logical structure.",
    category: "productivity",
    whenToUse: "Use when organizing project files, cleaning up directories, or establishing file management systems.",
    content: `# File Organizer Skill

## Principles
- Naming Conventions - Use descriptive names
- Folder Structure - Group by project/category
- Organization Rules - One file, one purpose

## Common Structures
- Project-Based: docs/, src/, tests/, assets/
- Date-Based: 2024/Q1/, 2024/Q2/`,
    instructions: `When organizing files:
1. Assess Current State - Review existing structure
2. Design Structure - Choose organization method
3. Implement - Create folders and move files
4. Maintain - Regular cleanup`,
    examples: [
      "Organize a software project repository",
      "Clean up a downloads folder",
      "Structure a documentation library",
    ],
    tags: ["organization", "files", "productivity", "structure"],
  },

  {
    name: "Meeting Insights Analyzer",
    slug: "meeting-insights-analyzer",
    description: "Analyze meeting transcripts to uncover behavioral patterns including conflict avoidance, speaking ratios, filler words, and leadership style.",
    category: "productivity",
    whenToUse: "Use when analyzing meeting recordings or transcripts to extract insights and improve meeting effectiveness.",
    content: `# Meeting Insights Analyzer

## Analysis Areas
- Speaking Patterns - Time distribution, interruptions
- Communication Style - Filler words, clarity
- Meeting Dynamics - Topic coverage, decisions

## Deliverables
- Speaking time breakdown
- Key discussion points
- Action items list
- Improvement suggestions`,
    instructions: `When analyzing meetings:
1. Process Transcript - Identify speakers
2. Analyze Patterns - Calculate speaking ratios
3. Extract Insights - Key decisions and action items
4. Provide Recommendations - Meeting improvements`,
    examples: [
      "Analyze a team standup for efficiency",
      "Review a client meeting for follow-ups",
      "Assess a brainstorming session for participation",
    ],
    tags: ["meetings", "analysis", "productivity", "communication"],
  },

  // ============================================
  // CREATIVE SKILLS
  // ============================================
  {
    name: "Artifacts Builder",
    slug: "artifacts-builder",
    description: "Create elaborate, multi-component HTML artifacts using modern frontend technologies (React, Tailwind CSS, shadcn/ui).",
    category: "creative",
    whenToUse: "Use when creating interactive HTML components, dashboards, or visual artifacts.",
    content: `# Artifacts Builder

## Technologies
- React - Component-based architecture
- Tailwind CSS - Utility-first styling
- shadcn/ui - Pre-built components

## Best Practices
- Component composition
- Responsive design
- Accessibility
- Performance optimization`,
    instructions: `When building artifacts:
1. Plan the Component - Define requirements
2. Build Structure - Create component hierarchy
3. Style with Tailwind - Apply utility classes
4. Polish and Test - Check accessibility`,
    examples: [
      "Build an interactive dashboard",
      "Create a data visualization component",
      "Design a form wizard",
    ],
    tags: ["react", "tailwind", "components", "frontend"],
  },

  // ============================================
  // DATA ANALYSIS SKILLS
  // ============================================
  {
    name: "Data Pipeline Builder",
    slug: "data-pipeline-builder",
    description: "Design and implement data pipelines for ETL processes, data transformation, and analytics workflows.",
    category: "data_analysis",
    whenToUse: "Use when building data pipelines, ETL processes, or data transformation workflows.",
    content: `# Data Pipeline Builder

## Pipeline Stages
1. Extract - Connect to data sources
2. Transform - Clean and process data
3. Load - Store in destination

## Best Practices
- Idempotent operations
- Error handling and retries
- Logging and monitoring
- Data validation`,
    instructions: `When building pipelines:
1. Define Sources and Destinations
2. Design Transformation Logic
3. Implement Error Handling
4. Add Monitoring and Alerts`,
    examples: [
      "Build an ETL pipeline for analytics",
      "Create a real-time data streaming pipeline",
      "Design a data warehouse loading process",
    ],
    tags: ["data", "etl", "pipeline", "analytics"],
  },

  // ============================================
  // SECURITY SKILLS
  // ============================================
  {
    name: "Security Auditor",
    slug: "security-auditor",
    description: "Perform security audits on code and infrastructure, identifying vulnerabilities and recommending fixes.",
    category: "security",
    whenToUse: "Use when reviewing code for security issues, auditing infrastructure, or implementing security best practices.",
    content: `# Security Auditor

## Audit Areas
- Code Security - SQL injection, XSS, CSRF
- Authentication - Password handling, session management
- Infrastructure - Network security, access controls
- Data Protection - Encryption, privacy

## OWASP Top 10
- Injection
- Broken Authentication
- Sensitive Data Exposure
- XML External Entities
- Broken Access Control`,
    instructions: `When auditing security:
1. Review Code for Common Vulnerabilities
2. Check Authentication and Authorization
3. Audit Infrastructure Configuration
4. Document Findings and Recommendations`,
    examples: [
      "Audit a web application for OWASP vulnerabilities",
      "Review API security and authentication",
      "Assess cloud infrastructure security",
    ],
    tags: ["security", "audit", "vulnerabilities", "owasp"],
  },
];

/**
 * Seed built-in skills to the database
 */
export async function seedBuiltInSkills(): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;

  for (const skillData of builtInSkillsData) {
    // Check if skill already exists
    const existing = await getSkillBySlug(skillData.slug);
    if (existing) {
      skipped++;
      continue;
    }

    // Create the skill
    const skill = await createSkill({
      name: skillData.name,
      slug: skillData.slug,
      description: skillData.description,
      category: skillData.category,
      content: skillData.content,
      whenToUse: skillData.whenToUse,
      instructions: skillData.instructions,
      examples: JSON.stringify(skillData.examples),
      tags: JSON.stringify(skillData.tags),
      isPublic: 1,
      isBuiltIn: 1,
      createdBy: null,
    });

    // Add scripts if any
    if (skillData.scripts) {
      for (const script of skillData.scripts) {
        await addSkillScript({
          skillId: skill.id,
          name: script.name,
          language: script.language,
          content: script.content,
          description: script.description,
        });
      }
    }

    // Add templates if any
    if (skillData.templates) {
      for (const template of skillData.templates) {
        await addSkillTemplate({
          skillId: skill.id,
          name: template.name,
          content: template.content,
          format: template.format,
          description: template.description,
        });
      }
    }

    created++;
  }

  return { created, skipped };
}

/**
 * Get count of built-in skills
 */
export function getBuiltInSkillsCount(): number {
  return builtInSkillsData.length;
}
