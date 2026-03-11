-- =============================================================================
-- KOPA Academy – Seed Data
-- =============================================================================
-- This file populates the KOPA Academy platform with reference/curriculum data.
-- Run after migrations have created all tables.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Skill Domains (10 rows)
-- ---------------------------------------------------------------------------
INSERT INTO skill_domains (id, name, sort_order) VALUES
  (1,  'Security & Risk Thinking', 1),
  (2,  'APIs & Protocols',         2),
  (3,  'Data Architecture',        3),
  (4,  'AI & LLM',                 4),
  (5,  'Deployment & Ops',         5),
  (6,  'Product Thinking',         6),
  (7,  'Web Dev',                  7),
  (8,  'Automation',               8),
  (9,  'Tooling',                  9),
  (10, 'Communication',            10);

-- ---------------------------------------------------------------------------
-- 2. Competencies (44 rows)
-- ---------------------------------------------------------------------------

-- Domain 1 – Security & Risk Thinking
INSERT INTO competencies (id, domain_id, name, desc_foundations, desc_practitioner, desc_mastery) VALUES
  (1,  1, 'Secret Management',
    'Understands why API keys and passwords must never be committed to code and can use .env files to store secrets locally.',
    'Configures secret injection in CI/CD and hosting platforms, rotates keys on a schedule, and audits repos for accidental leaks.',
    'Designs organisation-wide secret management policies using vaults, scoped access tokens, and automated rotation with zero-downtime deploys.'),
  (2,  1, 'Threat Modelling',
    'Can identify obvious risks in a system such as exposed endpoints or missing authentication.',
    'Applies lightweight threat-modelling frameworks (e.g. STRIDE) to new features and documents mitigations before implementation.',
    'Leads threat-modelling sessions across teams, prioritises risks by impact and likelihood, and integrates findings into the product roadmap.'),
  (3,  1, 'Access Control',
    'Understands the difference between authentication and authorisation and can explain role-based access at a high level.',
    'Implements row-level security policies and role checks in application code, ensuring users only see their own data.',
    'Architects multi-tenant access control systems with fine-grained permissions, audit trails, and policy-as-code enforcement.'),
  (4,  1, 'Data Sensitivity',
    'Recognises that personal data requires careful handling and can classify fields as public, internal, or confidential.',
    'Applies data-masking and anonymisation techniques and ensures sensitive columns are encrypted at rest.',
    'Defines data classification taxonomies, implements automated PII detection pipelines, and ensures compliance with GDPR and similar regulations.'),
  (5,  1, 'Input Validation',
    'Understands that user input must be validated and can apply basic type and length checks on form fields.',
    'Implements server-side validation with schema libraries, sanitises HTML input, and prevents SQL injection through parameterised queries.',
    'Designs defence-in-depth validation strategies across API gateway, application, and database layers with comprehensive error handling.');

-- Domain 2 – APIs & Protocols
INSERT INTO competencies (id, domain_id, name, desc_foundations, desc_practitioner, desc_mastery) VALUES
  (6,  2, 'HTTP Fundamentals',
    'Can explain what HTTP methods (GET, POST) do and read a basic API response including status codes.',
    'Debugs API issues using headers, status codes, and request/response bodies; understands caching, CORS, and content negotiation.',
    'Designs RESTful APIs with proper status code semantics, content negotiation, rate limiting, and pagination strategies.'),
  (7,  2, 'REST API Consumption',
    'Can make simple GET and POST requests using a tool like Postman or curl and parse JSON responses.',
    'Integrates multiple third-party APIs with error handling, retry logic, and response transformation in application code.',
    'Builds robust API client libraries with automatic pagination, circuit breakers, and comprehensive test mocking.'),
  (8,  2, 'API Authentication',
    'Understands that APIs require keys or tokens and can add an Authorization header to a request.',
    'Implements OAuth 2.0 flows, manages token refresh cycles, and securely stores credentials in server-side environments.',
    'Designs authentication architectures supporting multiple providers, scoped API keys, and token introspection for microservice meshes.'),
  (9,  2, 'Webhooks & Events',
    'Understands that webhooks push data to your application when events occur in an external service.',
    'Implements webhook receivers with signature verification, idempotency handling, and retry-safe processing.',
    'Architects event-driven systems with dead-letter queues, fan-out patterns, and end-to-end delivery guarantees.'),
  (10, 2, 'MCP & Tool Use',
    'Understands the concept of giving AI models access to tools and can describe what the Model Context Protocol enables.',
    'Builds MCP servers that expose database queries or API calls as tools an AI assistant can invoke.',
    'Designs composable tool ecosystems with permission scoping, usage analytics, and graceful degradation when tools are unavailable.');

-- Domain 3 – Data Architecture
INSERT INTO competencies (id, domain_id, name, desc_foundations, desc_practitioner, desc_mastery) VALUES
  (11, 3, 'Schema Design',
    'Can create simple database tables with appropriate column types and understands primary keys.',
    'Designs normalised schemas with foreign keys, indexes, and constraints that support the application''s query patterns.',
    'Architects multi-table schemas with migration strategies, partitioning plans, and performance benchmarks for production workloads.'),
  (12, 3, 'CRUD Operations',
    'Can write basic SELECT, INSERT, UPDATE, and DELETE queries against a single table.',
    'Writes complex queries with joins, aggregations, and subqueries; uses transactions to maintain data integrity.',
    'Optimises query performance with execution plans, writes database functions, and implements bulk upsert patterns.'),
  (13, 3, 'Data Flow Design',
    'Can describe how data moves from a user''s browser through an API to a database and back.',
    'Maps end-to-end data flows across multiple services, identifies transformation steps, and documents data contracts.',
    'Designs system-wide data architectures with event sourcing, caching layers, and consistency guarantees across distributed services.'),
  (14, 3, 'Embeddings & Vectors',
    'Understands that text can be converted to numerical vectors and that similar texts have similar vectors.',
    'Generates embeddings via API, stores them in a vector database, and implements basic similarity search for retrieval.',
    'Tunes embedding models and chunking strategies, benchmarks retrieval precision/recall, and builds hybrid search combining vectors with keyword filters.'),
  (15, 3, 'Supabase Platform',
    'Can navigate the Supabase dashboard, create tables, and insert rows using the table editor.',
    'Uses Supabase client libraries for auth, storage, and real-time subscriptions; writes Row Level Security policies.',
    'Architects full applications on Supabase with edge functions, database webhooks, custom claims, and performance-tuned connection pooling.');

-- Domain 4 – AI & LLM
INSERT INTO competencies (id, domain_id, name, desc_foundations, desc_practitioner, desc_mastery) VALUES
  (16, 4, 'Prompt Engineering',
    'Can write clear instructions to an LLM and understands that specificity and examples improve output quality.',
    'Uses system prompts, few-shot examples, and chain-of-thought techniques to reliably steer model behaviour for specific tasks.',
    'Designs prompt architectures with template composition, dynamic context injection, and automated evaluation suites for prompt regression testing.'),
  (17, 4, 'Claude API Usage',
    'Can make a basic API call to Claude with a user message and receive a text response.',
    'Manages conversations with system prompts, handles streaming responses, and implements token-aware context windowing.',
    'Builds production Claude integrations with usage tracking, cost optimisation, fallback models, and structured error recovery.'),
  (18, 4, 'Structured Output',
    'Understands that LLMs can return JSON and can parse a simple structured response from a prompt.',
    'Designs prompts with output schemas, validates responses against expected structures, and handles malformed outputs gracefully.',
    'Implements reliable structured extraction pipelines with schema versioning, confidence scoring, and human-in-the-loop validation for edge cases.'),
  (19, 4, 'RAG',
    'Understands that Retrieval Augmented Generation combines search results with LLM generation to ground answers in real data.',
    'Builds RAG pipelines that chunk documents, retrieve relevant passages via embeddings, and inject context into prompts with source citations.',
    'Optimises RAG systems with re-ranking, hybrid retrieval, metadata filtering, and evaluation frameworks measuring faithfulness and relevance.'),
  (20, 4, 'AI for Analysis',
    'Can use an LLM to summarise text or extract key points from a document.',
    'Builds analysis workflows that classify, compare, and synthesise information across multiple documents with consistent output formats.',
    'Designs multi-stage analysis pipelines with validation checkpoints, confidence thresholds, and automated quality assurance for business-critical insights.');

-- Domain 5 – Deployment & Ops
INSERT INTO competencies (id, domain_id, name, desc_foundations, desc_practitioner, desc_mastery) VALUES
  (21, 5, 'Cloud Deployment',
    'Can deploy a simple application to a platform like Vercel or Railway by connecting a GitHub repository.',
    'Configures build settings, environment variables, and custom domains; sets up preview deployments for pull requests.',
    'Designs deployment pipelines with blue-green strategies, rollback automation, and infrastructure-as-code for reproducible environments.'),
  (22, 5, 'Scheduling & Cron',
    'Understands that cron jobs run tasks on a schedule and can read basic cron expressions.',
    'Implements scheduled tasks using platform cron features, handles overlapping runs, and adds monitoring for missed executions.',
    'Designs distributed scheduling systems with job queues, priority levels, and observability dashboards tracking execution health.'),
  (23, 5, 'Environment Management',
    'Understands the difference between development, staging, and production environments.',
    'Maintains separate environment configurations with proper secret management and database isolation between stages.',
    'Architects environment promotion pipelines with automated smoke tests, feature flags, and configuration drift detection.'),
  (24, 5, 'Monitoring',
    'Understands that applications should be monitored and can check basic health endpoints or dashboard metrics.',
    'Sets up logging, error tracking, and uptime monitoring; configures alerts for error spikes and response time degradation.',
    'Builds comprehensive observability stacks with structured logging, distributed tracing, SLO dashboards, and automated incident response.');

-- Domain 6 – Product Thinking
INSERT INTO competencies (id, domain_id, name, desc_foundations, desc_practitioner, desc_mastery) VALUES
  (25, 6, 'User Research',
    'Can identify who the target users are and list their basic needs through conversation and observation.',
    'Conducts structured user interviews, synthesises findings into personas, and validates assumptions with prototype testing.',
    'Designs research programmes that combine quantitative analytics with qualitative insights to continuously inform product direction.'),
  (26, 6, 'Problem Scoping',
    'Can articulate the core problem a project is trying to solve in a single clear sentence.',
    'Breaks complex problems into sub-problems, identifies dependencies, and prioritises which to solve first based on impact.',
    'Facilitates problem-framing workshops, uses opportunity-solution trees, and aligns stakeholders around well-defined problem statements.'),
  (27, 6, 'Designing for Others',
    'Understands that tools should be intuitive for their intended users, not just the builder.',
    'Creates user flows and wireframes, applies basic UX heuristics, and iterates designs based on user feedback.',
    'Leads design thinking processes, conducts usability testing, and ensures accessibility standards are met across all user touchpoints.'),
  (28, 6, 'Trade-off Articulation',
    'Can explain why a simpler approach was chosen over a more complex one in their own projects.',
    'Documents trade-offs between competing approaches considering time, quality, scalability, and maintenance costs.',
    'Presents trade-off analyses to stakeholders with data-backed recommendations, risk assessments, and reversibility considerations.'),
  (29, 6, 'Spec & Requirements',
    'Can write a basic list of features and acceptance criteria for a small project.',
    'Writes detailed specifications with user stories, edge cases, and technical constraints that a developer could implement from.',
    'Authors comprehensive product specifications with architecture decision records, non-functional requirements, and phased delivery plans.');

-- Domain 7 – Web Dev
INSERT INTO competencies (id, domain_id, name, desc_foundations, desc_practitioner, desc_mastery) VALUES
  (30, 7, 'HTML & CSS',
    'Can create a basic web page with headings, paragraphs, links, and simple styling using CSS classes.',
    'Builds responsive layouts with flexbox/grid, uses a utility CSS framework like Tailwind, and ensures cross-browser compatibility.',
    'Architects component-based design systems with CSS custom properties, animation libraries, and comprehensive responsive breakpoints.'),
  (31, 7, 'JavaScript & DOM',
    'Can write basic JavaScript to handle button clicks, read form values, and update text on a page.',
    'Uses modern JavaScript features (async/await, destructuring, modules) and manipulates the DOM efficiently with event delegation.',
    'Builds complex interactive UIs with state management, optimistic updates, and performance-tuned rendering strategies.'),
  (32, 7, 'Frontend-Backend Integration',
    'Can fetch data from an API endpoint and display it on a web page using JavaScript.',
    'Implements full client-server data flows with loading states, error handling, caching, and form submissions.',
    'Architects frontend data layers with optimistic mutations, real-time subscriptions, and offline-first strategies.'),
  (33, 7, 'Search & Display UX',
    'Can implement a basic search input that filters a list of items displayed on the page.',
    'Builds search interfaces with debounced queries, highlighted results, faceted filters, and pagination.',
    'Designs search experiences with typeahead, fuzzy matching, relevance tuning, and analytics-driven result ranking.');

-- Domain 8 – Automation
INSERT INTO competencies (id, domain_id, name, desc_foundations, desc_practitioner, desc_mastery) VALUES
  (34, 8, 'Visual Workflows',
    'Can build a simple automation using a visual tool like Make or Zapier that connects two services.',
    'Designs multi-step workflows with conditional branching, error handling, and data transformation between services.',
    'Architects enterprise automation systems with reusable modules, monitoring dashboards, and cost-optimised execution strategies.'),
  (35, 8, 'Data Pipelines',
    'Understands that data often needs to be collected, cleaned, and moved between systems on a schedule.',
    'Builds data pipelines that extract from APIs, transform and validate data, and load into databases with error logging.',
    'Designs fault-tolerant ETL architectures with incremental processing, schema evolution handling, and data quality monitoring.'),
  (36, 8, 'Notification & Delivery',
    'Understands that automated systems need to deliver outputs to users via email, Slack, or other channels.',
    'Implements multi-channel notification systems with templating, delivery tracking, and user preference management.',
    'Architects notification platforms with priority queues, rate limiting, digest aggregation, and cross-channel delivery optimisation.');

-- Domain 9 – Tooling
INSERT INTO competencies (id, domain_id, name, desc_foundations, desc_practitioner, desc_mastery) VALUES
  (37, 9, 'Git & GitHub',
    'Can clone a repository, make commits, push changes, and create pull requests using GitHub.',
    'Uses branching strategies, resolves merge conflicts, writes meaningful commit messages, and reviews others'' pull requests.',
    'Designs Git workflows for teams with branch protection, CI gates, automated releases, and monorepo management strategies.'),
  (38, 9, 'CLI Proficiency',
    'Can navigate the file system, run scripts, and install packages using the terminal.',
    'Writes shell scripts for common tasks, pipes commands together, and uses CLI tools for debugging and system inspection.',
    'Builds custom CLI tools, automates complex workflows with shell scripting, and configures terminal environments for maximum productivity.'),
  (39, 9, 'Dev Environment',
    'Can set up a local development environment with Node.js, a code editor, and required dependencies.',
    'Maintains reproducible dev environments with package managers, linters, formatters, and editor configurations shared via dotfiles.',
    'Architects containerised development environments with dev containers, shared toolchain configurations, and onboarding automation.'),
  (40, 9, 'API Testing Tools',
    'Can use Postman or a similar tool to send HTTP requests and inspect responses.',
    'Creates API test collections with environment variables, pre-request scripts, and automated assertion checks.',
    'Builds comprehensive API test suites integrated into CI pipelines with contract testing, load testing, and mock server generation.');

-- Domain 10 – Communication
INSERT INTO competencies (id, domain_id, name, desc_foundations, desc_practitioner, desc_mastery) VALUES
  (41, 10, 'README Writing',
    'Can write a basic README that explains what a project does and how to run it locally.',
    'Writes comprehensive READMEs with setup instructions, usage examples, architecture overview, and contribution guidelines.',
    'Creates documentation templates and standards that ensure consistent, maintainable READMEs across an entire organisation.'),
  (42, 10, 'Architecture Docs',
    'Can draw a simple diagram showing how the main parts of a system connect together.',
    'Writes architecture decision records, creates sequence diagrams, and documents system boundaries and data flows.',
    'Maintains living architecture documentation with automated diagram generation, versioned decision records, and stakeholder-appropriate views.'),
  (43, 10, 'Technical Explanation',
    'Can explain a technical concept to a non-technical colleague in plain language.',
    'Adjusts explanations for different audiences, uses analogies effectively, and can write clear technical blog posts or guides.',
    'Coaches others in technical communication, facilitates cross-team knowledge sharing, and creates organisation-wide technical writing standards.'),
  (44, 10, 'Presentation & Demo',
    'Can give a short demo of their project showing what it does and why it matters.',
    'Structures presentations with a clear narrative, handles Q&A confidently, and demonstrates technical concepts live.',
    'Delivers compelling technical presentations to diverse audiences, mentors others on demo skills, and creates reusable demo frameworks.');

-- ---------------------------------------------------------------------------
-- 3. Projects (10 rows, IDs 0-9)
-- ---------------------------------------------------------------------------
INSERT INTO projects (id, title, subtitle, brief, sort_order) VALUES
  (0, 'Setup Guide',
    'Setting up your development environment',
    'Get your local machine ready for the programme by installing essential tools, configuring your code editor, and making your first commit to GitHub. This project ensures everyone starts from a solid foundation.',
    0),
  (1, 'News Aggregator',
    'Building an automated news feed',
    'Build an automated system that collects news from multiple RSS feeds and APIs, filters for relevance, and delivers a daily digest. You will learn API consumption, data storage, and scheduling fundamentals.',
    1),
  (2, 'Task Tracker',
    'A simple project management tool',
    'Create a web-based task tracker where users can create, update, and complete tasks organised by project. This project covers full CRUD operations, basic UI development, and database design.',
    2),
  (3, 'Meeting Summariser',
    'AI-powered meeting notes',
    'Build a tool that takes meeting transcripts and uses Claude to produce structured summaries with action items, decisions, and key discussion points. You will learn prompt engineering and structured output handling.',
    3),
  (4, 'Slack Assistant',
    'Building a Slack bot with AI capabilities',
    'Create a Slack bot that responds to team queries using AI, can search internal documents, and automates common team workflows. This project covers webhooks, event handling, and conversational AI.',
    4),
  (5, 'Meeting Scheduler',
    'Smart calendar management',
    'Build an intelligent scheduling tool that finds optimal meeting times, handles timezone differences, and sends calendar invitations. You will work with external APIs, conflict resolution logic, and notification delivery.',
    5),
  (6, 'Knowledge Base',
    'Internal documentation system',
    'Create a searchable knowledge base where team members can contribute articles that are automatically indexed using embeddings for semantic search. This project combines RAG, vector storage, and content management.',
    6),
  (7, 'Report Generator',
    'Automated reporting tool',
    'Build a system that pulls data from multiple sources, uses AI to analyse trends and anomalies, and generates formatted reports delivered on a schedule. You will integrate data pipelines, AI analysis, and document generation.',
    7),
  (8, 'APIs, MCP & Personal',
    'Advanced integrations and personal tooling',
    'Design and build MCP tool servers that connect AI assistants to real APIs and data sources. You will also build a personal productivity tool of your choosing that demonstrates advanced integration skills.',
    8),
  (9, 'The Open Brief',
    'Self-directed capstone project',
    'Propose, design, and build an original tool that solves a real problem for your team or organisation. This capstone project demonstrates your ability to independently scope, build, and ship a complete solution.',
    9);

-- ---------------------------------------------------------------------------
-- 4. Layers (59 rows)
-- ---------------------------------------------------------------------------

-- P0 – Setup Guide (4 layers)
INSERT INTO layers (id, project_id, name, description, sort_order, requires_github, tier_level) VALUES
  (1,  0, 'Accounts & Access',
    'Create accounts for GitHub, Supabase, and other services used throughout the programme.', 1, false, 1),
  (2,  0, 'Editor & Terminal Setup',
    'Install and configure VS Code with essential extensions and become comfortable using the integrated terminal.', 2, false, 1),
  (3,  0, 'First Repository',
    'Create your first GitHub repository, make an initial commit, and push it to the remote.', 3, true, 1),
  (4,  0, 'Environment Variables',
    'Learn to manage secrets using .env files and understand why sensitive configuration must never be committed.', 4, true, 1);

-- P1 – News Aggregator (6 layers)
INSERT INTO layers (id, project_id, name, description, sort_order, requires_github, tier_level) VALUES
  (5,  1, 'API Exploration',
    'Discover and test news APIs using Postman, understand request/response structures and API key authentication.', 1, true, 1),
  (6,  1, 'Data Storage Setup',
    'Design a database schema for storing articles and configure a Supabase project with the required tables.', 2, true, 1),
  (7,  1, 'Fetch & Store Pipeline',
    'Write code that fetches articles from an API and stores them in the database with deduplication logic.', 3, true, 1),
  (8,  1, 'Filtering & Display',
    'Build a simple web interface that displays stored articles with search and category filtering.', 4, true, 1),
  (9,  1, 'Scheduling & Automation',
    'Set up a cron job that runs the fetch pipeline on a schedule and sends a daily digest notification.', 5, true, 1),
  (57, 1, 'Error Handling & Logging',
    'Add robust error handling for API failures and implement logging to track pipeline health and debug issues.', 6, true, 1);

-- P2 – Task Tracker (6 layers)
INSERT INTO layers (id, project_id, name, description, sort_order, requires_github, tier_level) VALUES
  (10, 2, 'Database Design',
    'Design the task tracker schema with tables for projects, tasks, and statuses, including proper relationships.', 1, true, 1),
  (11, 2, 'CRUD API',
    'Implement create, read, update, and delete operations for tasks using the Supabase client library.', 2, true, 1),
  (12, 2, 'Task List UI',
    'Build the main task list view with HTML, CSS, and JavaScript that displays tasks grouped by status.', 3, true, 1),
  (13, 2, 'Task Forms & Validation',
    'Create forms for adding and editing tasks with client-side and server-side input validation.', 4, true, 1),
  (14, 2, 'User Authentication',
    'Add sign-up, login, and access control so users can only see and manage their own tasks.', 5, true, 1),
  (15, 2, 'Testing & Polish',
    'Write tests for critical paths, fix edge cases, and polish the UI for a complete user experience.', 6, true, 1);

-- P3 – Meeting Summariser (6 layers)
INSERT INTO layers (id, project_id, name, description, sort_order, requires_github, tier_level) VALUES
  (16, 3, 'Prompt Design',
    'Design and iterate on prompts that reliably extract summaries, action items, and decisions from meeting transcripts.', 1, true, 2),
  (17, 3, 'Claude API Integration',
    'Connect to the Claude API, send transcripts for processing, and handle streaming responses.', 2, true, 2),
  (18, 3, 'Structured Output Parsing',
    'Ensure the AI returns well-structured JSON output and implement validation and error handling for malformed responses.', 3, true, 2),
  (19, 3, 'Storage & Retrieval',
    'Store summaries in the database with metadata and build an interface to browse and search past meetings.', 4, true, 2),
  (20, 3, 'Multi-format Input',
    'Support multiple input formats including pasted text, uploaded files, and audio transcription services.', 5, true, 2),
  (21, 3, 'Deployment & Sharing',
    'Deploy the application, set up environment management, and enable sharing summaries with team members.', 6, true, 2);

-- P4 – Slack Assistant (6 layers)
INSERT INTO layers (id, project_id, name, description, sort_order, requires_github, tier_level) VALUES
  (22, 4, 'Slack App Setup',
    'Create a Slack application, configure bot permissions, and set up webhook endpoints to receive events.', 1, true, 2),
  (23, 4, 'Message Handling',
    'Process incoming Slack messages, route them to appropriate handlers, and respond with formatted messages.', 2, true, 2),
  (24, 4, 'AI Response Generation',
    'Integrate Claude to generate intelligent responses to user questions with conversation context management.', 3, true, 2),
  (25, 4, 'Knowledge Search',
    'Connect the bot to an internal knowledge source so it can search and cite relevant documents when answering.', 4, true, 2),
  (26, 4, 'Workflow Automation',
    'Add slash commands and interactive elements that trigger automated workflows like ticket creation and standup collection.', 5, true, 2),
  (58, 4, 'Testing & Deployment',
    'Write integration tests for bot interactions, deploy to a cloud environment, and configure monitoring for uptime and errors.', 6, true, 2);

-- P5 – Meeting Scheduler (7 layers)
INSERT INTO layers (id, project_id, name, description, sort_order, requires_github, tier_level) VALUES
  (27, 5, 'Calendar API Integration',
    'Connect to calendar APIs to read availability and understand how calendar events are structured.', 1, true, 2),
  (28, 5, 'Availability Engine',
    'Build logic that calculates available time slots across multiple participants and timezones.', 2, true, 2),
  (29, 5, 'Scheduling Algorithm',
    'Implement an algorithm that finds optimal meeting times based on preferences, priorities, and constraints.', 3, true, 2),
  (30, 5, 'Booking & Invitations',
    'Create the booking flow that reserves a time slot and sends calendar invitations to all participants.', 4, true, 2),
  (31, 5, 'Notification System',
    'Build a notification layer that sends confirmations, reminders, and rescheduling alerts via email and Slack.', 5, true, 2),
  (32, 5, 'User Preferences',
    'Allow users to set scheduling preferences such as preferred meeting times, buffer periods, and focus blocks.', 6, true, 2),
  (33, 5, 'Conflict Resolution',
    'Handle edge cases like double-bookings, cancelled meetings, and recurring event conflicts with user-friendly resolution flows.', 7, true, 2);

-- P6 – Knowledge Base (6 layers)
INSERT INTO layers (id, project_id, name, description, sort_order, requires_github, tier_level) VALUES
  (34, 6, 'Content Schema & Storage',
    'Design the database schema for articles, categories, and tags with full-text search support.', 1, true, 2),
  (35, 6, 'Article Editor',
    'Build a rich-text editor for creating and updating knowledge base articles with formatting and media support.', 2, true, 2),
  (36, 6, 'Embedding Generation',
    'Generate vector embeddings for articles and store them for semantic search capabilities.', 3, true, 2),
  (37, 6, 'Semantic Search',
    'Implement search that combines keyword matching with vector similarity for more relevant results.', 4, true, 2),
  (38, 6, 'RAG-Powered Q&A',
    'Build a question-answering interface that retrieves relevant articles and uses AI to synthesise answers with citations.', 5, true, 2),
  (39, 6, 'Access Control & Deployment',
    'Implement team-based access control for content management and deploy the application for team use.', 6, true, 2);

-- P7 – Report Generator (6 layers)
INSERT INTO layers (id, project_id, name, description, sort_order, requires_github, tier_level) VALUES
  (40, 7, 'Data Source Integration',
    'Connect to multiple data sources via APIs and build a unified data fetching layer with error handling.', 1, true, 3),
  (41, 7, 'Data Pipeline & Transformation',
    'Build ETL pipelines that clean, transform, and aggregate data from different sources into a consistent format.', 2, true, 3),
  (42, 7, 'AI Analysis Engine',
    'Use Claude to analyse aggregated data, identify trends, flag anomalies, and generate narrative insights.', 3, true, 3),
  (43, 7, 'Report Template System',
    'Design a template system that combines data visualisations, AI-generated text, and structured metrics into formatted reports.', 4, true, 3),
  (44, 7, 'Scheduled Generation',
    'Implement scheduled report generation with configurable frequencies and delivery to stakeholders via email.', 5, true, 3),
  (45, 7, 'Monitoring & Error Handling',
    'Add comprehensive monitoring, error handling, and alerting to ensure reports are generated reliably.', 6, true, 3);

-- P8 – APIs, MCP & Personal (6 layers)
INSERT INTO layers (id, project_id, name, description, sort_order, requires_github, tier_level) VALUES
  (46, 8, 'MCP Server Fundamentals',
    'Build a basic MCP server that exposes simple tools an AI assistant can discover and invoke.', 1, true, 3),
  (47, 8, 'API-Connected Tools',
    'Create MCP tools that wrap real third-party APIs, enabling AI assistants to query live data sources.', 2, true, 3),
  (48, 8, 'Database Tools',
    'Build MCP tools that provide safe, scoped access to database queries with proper input validation.', 3, true, 3),
  (49, 8, 'Tool Composition & Security',
    'Design multi-tool workflows with permission scoping, rate limiting, and audit logging for all tool invocations.', 4, true, 3),
  (50, 8, 'Personal Tool Project',
    'Design and build a personal productivity tool that demonstrates advanced API integration and automation skills.', 5, true, 3),
  (51, 8, 'Documentation & Showcase',
    'Write comprehensive documentation including architecture decisions, a README, and prepare a demo of your tools.', 6, true, 3);

-- P9 – The Open Brief (6 layers)
INSERT INTO layers (id, project_id, name, description, sort_order, requires_github, tier_level) VALUES
  (52, 9, 'Problem Discovery & Proposal',
    'Identify a real problem in your team or organisation, research existing solutions, and write a project proposal.', 1, true, 3),
  (53, 9, 'Specification & Architecture',
    'Write a detailed specification with user stories, technical architecture, and a phased delivery plan.', 2, true, 3),
  (54, 9, 'Core Implementation',
    'Build the core functionality of your proposed tool with a focus on solving the primary use case end-to-end.', 3, true, 3),
  (55, 9, 'Testing, Security & Polish',
    'Add tests, security hardening, error handling, and UI polish to bring the project to a shippable standard.', 4, true, 3),
  (56, 9, 'Launch & Presentation',
    'Deploy the project, onboard initial users, gather feedback, and deliver a final presentation to the cohort.', 5, true, 3),
  (59, 9, 'Retrospective & Documentation',
    'Write a project retrospective covering lessons learned, update all documentation, and archive the project for future reference.', 6, true, 3);

-- ---------------------------------------------------------------------------
-- 5. Layer-Competency Mappings (~2-3 competencies per layer)
-- ---------------------------------------------------------------------------
INSERT INTO layer_competencies (layer_id, competency_id, tier) VALUES
  -- P0 – Setup Guide
  (1, 39, 1),  -- Dev Environment
  (1, 37, 1),  -- Git & GitHub
  (2,  39, 1),  -- Dev Environment
  (2,  38, 1),  -- CLI Proficiency
  (3,  37, 1),  -- Git & GitHub
  (3,  41, 1),  -- README Writing
  (4,  1,  1),  -- Secret Management
  (4,  23, 1),  -- Environment Management

  -- P1 – News Aggregator
  (5,  6,  1),  -- HTTP Fundamentals
  (5,  8,  1),  -- API Authentication
  (5,  40, 1),  -- API Testing Tools
  (6,  11, 1),  -- Schema Design
  (6,  15, 1),  -- Supabase Platform
  (7,  7,  1),  -- REST API Consumption
  (7,  12, 1),  -- CRUD Operations
  (8,  33, 1),  -- Search & Display UX
  (8,  30, 1),  -- HTML & CSS
  (9,  22, 1),  -- Scheduling & Cron
  (9,  36, 1),  -- Notification & Delivery

  -- P2 – Task Tracker
  (10, 11, 1),  -- Schema Design
  (10, 13, 1),  -- Data Flow Design
  (11, 12, 1),  -- CRUD Operations
  (11, 15, 1),  -- Supabase Platform
  (12, 30, 1),  -- HTML & CSS
  (12, 31, 1),  -- JavaScript & DOM
  (13, 5,  1),  -- Input Validation
  (13, 32, 1),  -- Frontend-Backend Integration
  (14, 3,  1),  -- Access Control
  (14, 8,  1),  -- API Authentication
  (15, 41, 1),  -- README Writing
  (15, 4,  1),  -- Data Sensitivity

  -- P3 – Meeting Summariser
  (16, 16, 2),  -- Prompt Engineering
  (16, 20, 2),  -- AI for Analysis
  (17, 17, 2),  -- Claude API Usage
  (17, 7,  2),  -- REST API Consumption
  (18, 18, 2),  -- Structured Output
  (18, 5,  2),  -- Input Validation
  (19, 12, 2),  -- CRUD Operations
  (19, 33, 2),  -- Search & Display UX
  (20, 13, 2),  -- Data Flow Design
  (20, 32, 2),  -- Frontend-Backend Integration
  (21, 21, 2),  -- Cloud Deployment
  (21, 23, 2),  -- Environment Management

  -- P4 – Slack Assistant
  (22, 9,  2),  -- Webhooks & Events
  (22, 8,  2),  -- API Authentication
  (23, 7,  2),  -- REST API Consumption
  (23, 31, 2),  -- JavaScript & DOM
  (24, 16, 2),  -- Prompt Engineering
  (24, 17, 2),  -- Claude API Usage
  (25, 19, 2),  -- RAG
  (25, 14, 2),  -- Embeddings & Vectors
  (26, 34, 2),  -- Visual Workflows
  (26, 36, 2),  -- Notification & Delivery

  -- P5 – Meeting Scheduler
  (27, 7,  2),  -- REST API Consumption
  (27, 8,  2),  -- API Authentication
  (28, 31, 2),  -- JavaScript & DOM
  (28, 13, 2),  -- Data Flow Design
  (29, 26, 2),  -- Problem Scoping
  (29, 28, 2),  -- Trade-off Articulation
  (30, 9,  2),  -- Webhooks & Events
  (30, 32, 2),  -- Frontend-Backend Integration
  (31, 36, 2),  -- Notification & Delivery
  (31, 22, 2),  -- Scheduling & Cron
  (32, 27, 2),  -- Designing for Others
  (32, 15, 2),  -- Supabase Platform
  (33, 5,  2),  -- Input Validation
  (33, 28, 2),  -- Trade-off Articulation

  -- P6 – Knowledge Base
  (34, 11, 2),  -- Schema Design
  (34, 15, 2),  -- Supabase Platform
  (35, 30, 2),  -- HTML & CSS
  (35, 27, 2),  -- Designing for Others
  (36, 14, 2),  -- Embeddings & Vectors
  (36, 17, 2),  -- Claude API Usage
  (37, 33, 2),  -- Search & Display UX
  (37, 14, 2),  -- Embeddings & Vectors
  (38, 19, 2),  -- RAG
  (38, 16, 2),  -- Prompt Engineering
  (39, 3,  2),  -- Access Control
  (39, 21, 2),  -- Cloud Deployment

  -- P7 – Report Generator
  (40, 7,  3),  -- REST API Consumption
  (40, 6,  3),  -- HTTP Fundamentals
  (41, 35, 3),  -- Data Pipelines
  (41, 13, 3),  -- Data Flow Design
  (42, 20, 3),  -- AI for Analysis
  (42, 16, 3),  -- Prompt Engineering
  (43, 18, 3),  -- Structured Output
  (43, 42, 3),  -- Architecture Docs
  (44, 22, 3),  -- Scheduling & Cron
  (44, 36, 3),  -- Notification & Delivery
  (45, 24, 3),  -- Monitoring
  (45, 2,  3),  -- Threat Modelling

  -- P8 – APIs, MCP & Personal
  (46, 10, 3),  -- MCP & Tool Use
  (46, 6,  3),  -- HTTP Fundamentals
  (47, 10, 3),  -- MCP & Tool Use
  (47, 7,  3),  -- REST API Consumption
  (48, 10, 3),  -- MCP & Tool Use
  (48, 12, 3),  -- CRUD Operations
  (49, 3,  3),  -- Access Control
  (49, 1,  3),  -- Secret Management
  (50, 26, 3),  -- Problem Scoping
  (50, 34, 3),  -- Visual Workflows
  (51, 41, 3),  -- README Writing
  (51, 44, 3),  -- Presentation & Demo

  -- P9 – The Open Brief
  (52, 25, 3),  -- User Research
  (52, 26, 3),  -- Problem Scoping
  (53, 29, 3),  -- Spec & Requirements
  (53, 42, 3),  -- Architecture Docs
  (54, 32, 3),  -- Frontend-Backend Integration
  (54, 35, 3),  -- Data Pipelines
  (55, 2,  3),  -- Threat Modelling
  (55, 4,  3),  -- Data Sensitivity
  (56, 44, 3),  -- Presentation & Demo
  (56, 43, 3),  -- Technical Explanation

  -- Additional layers (57, 58, 59)
  (57, 24, 1),  -- Monitoring (P1 – Error Handling & Logging)
  (57, 7,  1),  -- REST API Consumption
  (58, 21, 2),  -- Cloud Deployment (P4 – Testing & Deployment)
  (58, 24, 2),  -- Monitoring
  (59, 41, 3),  -- README Writing (P9 – Retrospective & Documentation)
  (59, 43, 3);  -- Technical Explanation

-- ---------------------------------------------------------------------------
-- 6. Knowledge Check Questions (78 rows)
-- ---------------------------------------------------------------------------
INSERT INTO knowledge_check_questions (id, layer_id, question_text, is_custom) VALUES
  -- P0 layers (questions 1-6)
  (1,  1,  'Why is it important to use separate accounts for development services rather than sharing credentials with teammates?', false),
  (2,  2,  'What are the benefits of using an integrated terminal in your code editor compared to a separate terminal application?', false),
  (3,  3,  'Explain the difference between a local Git repository and a remote repository on GitHub.', false),
  (4,  3,  'What is the purpose of a .gitignore file and what types of files should typically be excluded?', false),
  (5,  4,  'Explain how environment variables protect sensitive configuration from being exposed in source code.', false),
  (6,  4,  'What would happen if you accidentally committed an API key to a public GitHub repository?', false),

  -- P1 layers (questions 7-14)
  (7,  5,  'What is the difference between an API key sent as a query parameter versus one sent in an Authorization header?', false),
  (8,  5,  'Describe the meaning of HTTP status codes 200, 401, and 429 in the context of calling a news API.', false),
  (9,  6,  'Why is it important to define a primary key for each database table?', false),
  (10, 6,  'How would you design a schema to store articles from multiple news sources without duplicating content?', false),
  (11, 7,  'Explain a strategy for deduplicating articles that may appear in multiple API sources.', false),
  (12, 7,  'What error handling would you implement when an external API is temporarily unavailable?', false),
  (13, 8,  'How does a search filter on the frontend translate into a database query on the backend?', false),
  (14, 9,  'What is a cron expression and how would you schedule a task to run every day at 8am?', false),

  -- P2 layers (questions 15-24)
  (15, 10, 'Explain the concept of database normalisation and why it matters for a task tracker application.', false),
  (16, 10, 'How do foreign keys enforce data integrity between related tables?', false),
  (17, 11, 'Describe the difference between an INSERT and an UPSERT operation and when you would use each.', false),
  (18, 11, 'How does the Supabase client library simplify database operations compared to writing raw SQL?', false),
  (19, 12, 'What is the role of CSS Flexbox or Grid in building a responsive task list layout?', false),
  (20, 12, 'How would you update the DOM when a user changes a task''s status without reloading the page?', false),
  (21, 13, 'What strategies would you use to validate user input before it reaches the database?', false),
  (22, 13, 'Explain the difference between client-side and server-side validation and why both are needed.', false),
  (23, 14, 'Describe the difference between authentication and authorisation in the context of a multi-user application.', false),
  (24, 15, 'What types of data should be considered sensitive in a task management application and how would you protect them?', false),

  -- P3 layers (questions 25-34)
  (25, 16, 'How does providing specific examples in a prompt improve the consistency of LLM output?', false),
  (26, 16, 'Explain the concept of chain-of-thought prompting and when it is useful for analysis tasks.', false),
  (27, 17, 'What is the difference between a single-turn and multi-turn conversation when using the Claude API?', false),
  (28, 17, 'How would you handle a situation where the API response is cut off due to token limits?', false),
  (29, 18, 'Why is it important to validate the structure of JSON output from an LLM before using it in your application?', false),
  (30, 18, 'Describe a strategy for handling cases where the AI returns output that does not match the expected schema.', false),
  (31, 19, 'How would you design a database schema to store meeting summaries with searchable metadata?', false),
  (32, 19, 'What are the trade-offs between full-text search and simple keyword matching for finding past meetings?', false),
  (33, 20, 'What challenges arise when accepting multiple input formats and how would you normalise them?', false),
  (34, 21, 'What are the key differences between a development and production environment for a deployed AI application?', false),

  -- P4 layers (questions 35-42)
  (35, 22, 'How does a Slack webhook differ from a traditional REST API endpoint in terms of data flow?', false),
  (36, 22, 'What security measures should you implement when receiving webhook events from Slack?', false),
  (37, 23, 'How would you structure your code to route different types of Slack events to appropriate handler functions?', false),
  (38, 23, 'What is the three-second response requirement in Slack and how do you handle longer operations?', false),
  (39, 24, 'How would you manage conversation context across multiple messages in a Slack thread?', false),
  (40, 24, 'What strategies can you use to keep AI-generated Slack responses concise and useful?', false),
  (41, 25, 'Explain how RAG improves the accuracy of a Slack bot''s answers compared to using the LLM alone.', false),
  (42, 26, 'What considerations are important when designing interactive Slack workflows that trigger automated actions?', false),

  -- P5 layers (questions 43-52)
  (43, 27, 'What data structures are commonly used to represent calendar events and availability in API integrations?', false),
  (44, 27, 'How do you handle OAuth token refresh when integrating with calendar service APIs?', false),
  (45, 28, 'Explain how you would calculate overlapping free time across multiple participants in different timezones.', false),
  (46, 28, 'What edge cases need to be considered when computing availability (e.g. all-day events, recurring events)?', false),
  (47, 29, 'Describe how you would score and rank potential meeting times based on participant preferences.', false),
  (48, 29, 'What trade-offs exist between finding the optimal meeting time and responding quickly to the user?', false),
  (49, 30, 'How do webhook callbacks help in knowing whether a calendar invitation was accepted or declined?', false),
  (50, 31, 'What is the purpose of a notification queue and how does it prevent duplicate messages?', false),
  (51, 32, 'How would you design a user preference system that balances flexibility with simplicity?', false),
  (52, 33, 'Describe a strategy for resolving double-booking conflicts when two meeting requests arrive simultaneously.', false),

  -- P6 layers (questions 53-60)
  (53, 34, 'How would you design a schema that supports both category-based browsing and tag-based discovery of articles?', false),
  (54, 34, 'What indexes would you create to support efficient full-text search in a knowledge base?', false),
  (55, 35, 'What UX considerations are important when designing an article editor for non-technical contributors?', false),
  (56, 36, 'Explain the process of generating text embeddings and why chunk size matters for search quality.', false),
  (57, 36, 'How would you handle re-generating embeddings when an existing article is updated?', false),
  (58, 37, 'Describe the difference between keyword search and semantic search and when each is more effective.', false),
  (59, 38, 'How does a RAG pipeline decide which retrieved passages to include in the AI''s context window?', false),
  (60, 39, 'How would you implement role-based access control so editors can publish but viewers can only read?', false),

  -- P7 layers (questions 61-68)
  (61, 40, 'What strategies would you use to handle API rate limits when fetching data from multiple sources concurrently?', false),
  (62, 40, 'How do you ensure data consistency when different sources use different field names and formats?', false),
  (63, 41, 'Explain the difference between full data loads and incremental processing in a data pipeline.', false),
  (64, 41, 'What error handling patterns are important for data pipeline reliability?', false),
  (65, 42, 'How would you prompt an AI to identify trends and anomalies in a dataset while avoiding hallucinated insights?', false),
  (66, 42, 'What validation steps should follow AI-generated analysis before including it in a report?', false),
  (67, 43, 'Describe how you would design a report template system that separates content from presentation.', false),
  (68, 44, 'What monitoring and alerting would you set up to ensure scheduled reports are generated and delivered on time?', false),

  -- P8 layers (questions 69-74)
  (69, 46, 'Explain the core concepts of the Model Context Protocol and how tools are discovered by an AI assistant.', false),
  (70, 47, 'What security considerations are important when exposing a third-party API as an MCP tool?', false),
  (71, 47, 'How would you design error responses from an MCP tool so the AI can recover gracefully?', false),
  (72, 48, 'Why is it important to scope database access in MCP tools rather than exposing full query capabilities?', false),
  (73, 49, 'Describe an approach for implementing rate limiting and audit logging across multiple MCP tools.', false),
  (74, 51, 'What makes a good architecture decision record and when should you write one?', false),

  -- P9 layers (questions 75-78)
  (75, 52, 'How do you validate that a problem you have identified is worth solving before committing to building a solution?', false),
  (76, 53, 'What should a good technical specification include to enable someone else to implement your design?', false),
  (77, 55, 'Describe your approach to security hardening an application before it is used by real users.', false),
  (78, 56, 'How would you structure a final project presentation to effectively communicate both the problem and your solution?', false);

-- ---------------------------------------------------------------------------
-- 7. Question-Competency Mappings (80 rows)
-- ---------------------------------------------------------------------------
INSERT INTO question_competencies (question_id, competency_id, tier) VALUES
  -- P0 questions
  (1,  39, 1),  -- Dev Environment
  (2,  38, 1),  -- CLI Proficiency
  (3,  37, 1),  -- Git & GitHub
  (4,  37, 1),  -- Git & GitHub
  (5,  1,  1),  -- Secret Management
  (6,  1,  1),  -- Secret Management

  -- P1 questions
  (7,  8,  1),  -- API Authentication
  (8,  6,  1),  -- HTTP Fundamentals
  (9,  11, 1),  -- Schema Design
  (10, 11, 1),  -- Schema Design
  (10, 15, 1),  -- Supabase Platform (dual-map)
  (11, 12, 1),  -- CRUD Operations
  (12, 7,  1),  -- REST API Consumption
  (13, 33, 1),  -- Search & Display UX
  (14, 22, 1),  -- Scheduling & Cron

  -- P2 questions
  (15, 11, 1),  -- Schema Design
  (16, 11, 1),  -- Schema Design
  (17, 12, 1),  -- CRUD Operations
  (18, 15, 1),  -- Supabase Platform
  (19, 30, 1),  -- HTML & CSS
  (20, 31, 1),  -- JavaScript & DOM
  (21, 5,  1),  -- Input Validation
  (22, 5,  1),  -- Input Validation
  (23, 3,  1),  -- Access Control
  (24, 4,  1),  -- Data Sensitivity

  -- P3 questions
  (25, 16, 2),  -- Prompt Engineering
  (26, 16, 2),  -- Prompt Engineering
  (27, 17, 2),  -- Claude API Usage
  (28, 17, 2),  -- Claude API Usage
  (29, 18, 2),  -- Structured Output
  (30, 18, 2),  -- Structured Output
  (31, 12, 2),  -- CRUD Operations
  (32, 33, 2),  -- Search & Display UX
  (33, 13, 2),  -- Data Flow Design
  (34, 23, 2),  -- Environment Management

  -- P4 questions
  (35, 9,  2),  -- Webhooks & Events
  (36, 9,  2),  -- Webhooks & Events
  (36, 1,  2),  -- Secret Management (dual-map: security of webhooks)
  (37, 7,  2),  -- REST API Consumption
  (38, 7,  2),  -- REST API Consumption
  (39, 16, 2),  -- Prompt Engineering
  (40, 16, 2),  -- Prompt Engineering
  (41, 19, 2),  -- RAG
  (42, 34, 2),  -- Visual Workflows

  -- P5 questions
  (43, 7,  2),  -- REST API Consumption
  (44, 8,  2),  -- API Authentication
  (45, 31, 2),  -- JavaScript & DOM
  (46, 13, 2),  -- Data Flow Design
  (47, 26, 2),  -- Problem Scoping
  (48, 28, 2),  -- Trade-off Articulation
  (49, 9,  2),  -- Webhooks & Events
  (50, 36, 2),  -- Notification & Delivery
  (51, 27, 2),  -- Designing for Others
  (52, 5,  2),  -- Input Validation

  -- P6 questions
  (53, 11, 2),  -- Schema Design
  (54, 15, 2),  -- Supabase Platform
  (55, 27, 2),  -- Designing for Others
  (56, 14, 2),  -- Embeddings & Vectors
  (57, 14, 2),  -- Embeddings & Vectors
  (58, 33, 2),  -- Search & Display UX
  (59, 19, 2),  -- RAG
  (60, 3,  2),  -- Access Control

  -- P7 questions
  (61, 7,  3),  -- REST API Consumption
  (62, 13, 3),  -- Data Flow Design
  (63, 35, 3),  -- Data Pipelines
  (64, 35, 3),  -- Data Pipelines
  (65, 20, 3),  -- AI for Analysis
  (66, 20, 3),  -- AI for Analysis
  (67, 42, 3),  -- Architecture Docs
  (68, 24, 3),  -- Monitoring

  -- P8 questions
  (69, 10, 3),  -- MCP & Tool Use
  (70, 10, 3),  -- MCP & Tool Use
  (71, 10, 3),  -- MCP & Tool Use
  (72, 3,  3),  -- Access Control
  (73, 1,  3),  -- Secret Management
  (74, 42, 3),  -- Architecture Docs

  -- P9 questions
  (75, 25, 3),  -- User Research
  (76, 29, 3),  -- Spec & Requirements
  (77, 2,  3),  -- Threat Modelling
  (78, 44, 3); -- Presentation & Demo

-- ---------------------------------------------------------------------------
-- 8. AI Prompt Versions (2 rows)
-- ---------------------------------------------------------------------------
INSERT INTO ai_prompt_versions (id, persona, prompt_text, model_version, version, is_active) VALUES
  (
    'a0000000-0000-4000-8000-000000000001',
    'assistant',
    'You are the KOPA Academy AI Assistant. You help apprentices learn to build AI-powered tools by guiding them through projects. Be encouraging but rigorous. Ask clarifying questions rather than making assumptions. When an apprentice is stuck, guide them toward the answer rather than giving it directly. Reference specific competencies and tier descriptions when discussing skill development. Keep responses concise and practical.',
    'claude-sonnet-4-20250514',
    1,
    true
  ),
  (
    'a0000000-0000-4000-8000-000000000002',
    'evaluator',
    'You are the KOPA Academy Knowledge Check Evaluator. Your role is to assess whether an apprentice has understood a concept at the required tier level. Ask follow-up questions to probe depth of understanding. Evaluate responses against the competency tier descriptions: Foundations (tier 1) requires basic understanding and can-do ability, Practitioner (tier 2) requires applied skill with real-world considerations, Mastery (tier 3) requires architectural thinking and the ability to teach others. Assign one of: pass, developing, or not_yet. Be fair but maintain standards.',
    'claude-sonnet-4-20250514',
    1,
    true
  );

-- ---------------------------------------------------------------------------
-- 9. Cohort (1 row)
-- ---------------------------------------------------------------------------
INSERT INTO cohorts (id, name, started_at) VALUES
  ('c0000000-0000-4000-8000-000000000001', 'Cohort 1 – 2026', '2026-01-15');
