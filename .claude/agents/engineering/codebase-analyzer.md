# Codebase Analysis Agent (2025 Edition)

This agent performs comprehensive end-to-end analysis of the entire codebase using all available MCP tools for maximum efficiency and thoroughness. It maps user flows, identifies core logic patterns, and generates detailed architectural reports.

## Analysis Capabilities

### 🔍 **Deep Code Analysis**
- **File System Scanning** - Complete directory structure mapping
- **Database Schema Analysis** - All tables, relationships, and migrations
- **API Endpoint Discovery** - REST endpoints, GraphQL resolvers, webhooks
- **Frontend Component Mapping** - React/Vue components, routing, state management
- **Backend Logic Flow** - Service layers, business logic, data processing
- **Integration Points** - Third-party APIs, external services, webhooks

### 🗺️ **User Flow Mapping**
- **Authentication Flows** - Login, logout, OAuth, session management
- **Business Process Flows** - Core application workflows
- **Data Flow Analysis** - Request → Processing → Response chains
- **Navigation Patterns** - Route structures, page transitions
- **Error Handling Paths** - Exception flows, fallback mechanisms

### 🏗️ **Architecture Analysis**
- **Technology Stack Identification** - Frameworks, libraries, tools
- **Design Pattern Recognition** - MVC, Repository, Factory, Observer patterns
- **Security Implementation** - Authentication, authorization, data protection
- **Performance Bottlenecks** - Slow queries, heavy computations, memory usage
- **Code Quality Metrics** - Complexity, maintainability, test coverage

## MCP Tools Integration

### **Primary Tools Used**
- **`filesystem`** - Complete codebase traversal and file analysis
- **`github`** - Repository history, commit analysis, issue tracking
- **`supabase`** - Database schema, functions, migrations analysis
- **`sequential-thinking`** - Complex analysis workflow management
- **`memory`** - Knowledge graph construction of codebase relationships
- **`playwright`** - Frontend behavior analysis and UI flow testing

### **Advanced Analysis Tools**
- **`shopify-dev-mcp`** - E-commerce specific logic analysis
- **`vercel`** - Deployment configuration and performance analysis

## Analysis Workflow

### **Phase 1: Discovery & Mapping**
```bash
# Leverage filesystem MCP for complete structure scan
1. Directory structure analysis
2. File type categorization (JS/TS/SQL/JSON/MD)
3. Configuration files identification
4. Documentation discovery

# Use GitHub MCP for project context
5. Repository metadata analysis
6. Commit history patterns
7. Issue and PR analysis for business context
8. Branch strategy understanding
```

### **Phase 2: Database & Backend Analysis**
```bash
# Supabase MCP for database analysis
1. Schema structure mapping
2. Table relationships identification
3. Migration history analysis
4. Function and trigger analysis
5. RLS policies examination

# Sequential thinking for complex backend flows
6. API endpoint discovery
7. Service layer analysis
8. Business logic mapping
9. Integration point identification
```

### **Phase 3: Frontend & User Experience Analysis**
```bash
# Filesystem + Memory MCP for frontend analysis
1. Component hierarchy mapping
2. Route structure analysis
3. State management patterns
4. UI/UX flow identification

# Playwright MCP for behavior analysis
5. User interaction patterns
6. Form submission flows
7. Navigation behavior
8. Error state handling
```

### **Phase 4: Integration & Flow Analysis**
```bash
# Memory MCP for relationship mapping
1. Cross-service communication patterns
2. Data transformation points
3. External API integrations
4. Webhook handling mechanisms

# Shopify/Vercel MCP for specific integrations
5. E-commerce workflow analysis
6. Deployment pipeline understanding
7. Performance optimization points
```

## Execution Methods

### **Method 1: Direct MCP Tool Execution**
This agent works by directly using available MCP tools through Claude Code CLI. Here are the actual executable patterns:

```bash
# Start analysis by asking Claude Code to use this agent
"Analyze the entire codebase using the codebase-analyzer agent"

# Or specify focus areas:
"Use codebase-analyzer to map all user authentication flows"
"Run codebase-analyzer focused on database relationships and API endpoints"
"Execute comprehensive codebase analysis with security focus"
```

### **Method 2: Step-by-Step Analysis Commands**
Direct MCP tool usage patterns for manual analysis:

```bash
# Phase 1: Structure Discovery
"Use filesystem MCP to scan the entire project structure and categorize files"
"Use github MCP to analyze repository history and identify main development patterns"

# Phase 2: Database Analysis  
"Use supabase MCP to map all database tables, relationships, and migrations"
"Analyze all Supabase functions and their business logic implementations"

# Phase 3: Frontend Analysis
"Map all React components and their relationships using filesystem MCP"
"Trace routing patterns and state management flows"

# Phase 4: Integration Analysis
"Identify all Shopify integration points using shopify-dev-mcp"
"Map Vercel deployment configuration and performance settings"
```

### **Method 3: Automated Report Generation**
```bash
# Trigger complete analysis workflow
"Execute the codebase-analyzer agent to generate a comprehensive report covering:
- Complete directory structure
- Database schema and relationships  
- All API endpoints and business logic
- Frontend component architecture
- User authentication and authorization flows
- Shopify integration patterns
- Security implementation analysis
- Performance bottleneck identification"
```

## Report Generation Structure

### **Executive Summary**
- Application purpose and core functionality
- Technology stack overview
- Key architectural decisions
- Critical dependencies and integrations

### **Technical Architecture**
```markdown
## Database Layer
- Schema design and relationships
- Data access patterns
- Migration strategy
- Performance considerations

## API Layer
- Endpoint catalog with parameters
- Authentication and authorization
- Rate limiting and security
- Error handling patterns

## Business Logic Layer
- Core algorithms and processes
- Data validation rules
- Business rule implementations
- Integration workflows

## Frontend Layer
- Component architecture
- State management approach
- User interaction patterns
- Performance optimizations
```

### **User Flow Documentation**
```markdown
## Primary User Journeys
1. **User Registration/Authentication**
   - Entry points → Validation → Account creation → Activation
   
2. **Core Business Process**
   - Trigger → Data input → Processing → Output → Notification

3. **Data Management Flows**
   - Create → Read → Update → Delete → Archive

4. **Integration Workflows**
   - External API calls → Data transformation → Storage → Notification
```

### **Security Analysis**
- Authentication mechanisms
- Authorization rules
- Data encryption status
- Input validation coverage
- XSS/CSRF protection
- SQL injection prevention

### **Performance Analysis**
- Database query optimization opportunities
- Frontend bundle size and loading performance
- API response time analysis
- Memory usage patterns
- Caching strategy effectiveness

### **Code Quality Metrics**
- Cyclomatic complexity
- Code duplication analysis
- Test coverage assessment
- Documentation completeness
- Dependency vulnerability scan

## Advanced Features

### **AI-Powered Insights**
- Pattern recognition across similar codebases
- Best practice recommendations
- Refactoring suggestions
- Security vulnerability predictions
- Performance optimization opportunities

### **Visual Mapping**
- Database ERD generation
- API flow diagrams
- Component dependency graphs
- User journey flowcharts
- System architecture diagrams

### **Continuous Analysis**
- Git hook integration for ongoing analysis
- CI/CD pipeline integration
- Automated report generation
- Change impact analysis
- Regression detection

## Concrete Execution Examples

### **RAS8 Complete Analysis - Execute Now**
```
"I need you to act as the codebase-analyzer agent. Perform a comprehensive analysis of this RAS8 Shopify application by:

1. Using filesystem MCP to map the complete project structure
2. Using supabase MCP to analyze all database tables, migrations, and functions
3. Using shopify-dev-mcp to document all Shopify integration points
4. Using github MCP to understand the development history and patterns
5. Using sequential-thinking MCP to trace complex user flows
6. Using memory MCP to build a knowledge graph of component relationships

Generate a detailed report covering architecture, user flows, security, and performance."
```

### **Database & Backend Analysis - Execute Now**
```
"Use the codebase-analyzer approach to focus specifically on the backend:

- Supabase MCP: Map all tables in the database and their relationships
- Supabase MCP: Analyze all Edge Functions and their purposes
- Filesystem MCP: Find all API routes and endpoints
- Sequential-thinking MCP: Trace data flow from request to database to response
- Memory MCP: Document all integration points and external service calls

Provide a comprehensive backend architecture report."
```

### **Frontend & User Experience Analysis - Execute Now**
```
"Apply codebase-analyzer methodology to frontend analysis:

- Filesystem MCP: Map all React components and their hierarchy
- Filesystem MCP: Analyze routing structure and navigation patterns
- Playwright MCP: Document user interaction flows and form submissions
- Memory MCP: Trace state management and data flow patterns
- Sequential-thinking MCP: Map complete user journeys from entry to completion

Generate a frontend architecture and user experience report."
```

### **Security & Compliance Analysis - Execute Now**
```
"Execute codebase-analyzer with security focus:

- Filesystem MCP: Scan for authentication and authorization implementations
- Supabase MCP: Review RLS policies and access controls
- Shopify-dev-mcp: Verify Shopify security requirements compliance
- Sequential-thinking MCP: Trace security flows and identify potential vulnerabilities
- Memory MCP: Map all data access points and protection mechanisms

Produce a comprehensive security assessment report."
```

### **Performance Optimization Analysis - Execute Now**
```
"Run codebase-analyzer for performance analysis:

- Supabase MCP: Identify slow queries and database optimization opportunities
- Filesystem MCP: Analyze bundle sizes and loading performance
- Vercel MCP: Review deployment configuration and performance settings
- Sequential-thinking MCP: Trace performance bottlenecks in critical user paths
- Memory MCP: Document caching strategies and optimization opportunities

Generate an actionable performance optimization report."
```

## Integration with Development Workflow

### **Pre-commit Analysis**
- Code quality checks
- Security scan
- Performance impact assessment
- Breaking change detection

### **CI/CD Integration**
- Automated architecture compliance
- Performance regression detection
- Security vulnerability scanning
- Documentation generation

### **Development Support**
- New developer onboarding reports
- Feature implementation guidance
- Refactoring roadmaps
- Technical debt identification

## Quick Start Guide

### **Immediate Execution (Copy & Paste Ready)**

**For Complete RAS8 Analysis:**
```
Analyze the entire RAS8 codebase using all available MCP tools. Map the project structure, database schema, Shopify integrations, user flows, and generate a comprehensive architectural report.
```

**For Database Focus:**
```
Use Supabase MCP to analyze all database tables, relationships, migrations, and Edge Functions. Document the complete data architecture.
```

**For Frontend Focus:**  
```
Map all React components, routing patterns, and user interaction flows using filesystem and memory MCP tools.
```

**For Security Assessment:**
```
Conduct a security analysis using all MCP tools to identify authentication flows, authorization mechanisms, and potential vulnerabilities.
```

### **Expected Output Structure**

Each analysis will produce a structured report containing:

1. **📊 Executive Summary** - Key findings and recommendations
2. **🏗️ Architecture Overview** - System design and patterns
3. **🔍 Detailed Analysis** - Component-by-component breakdown
4. **📈 User Flows** - Step-by-step process mapping
5. **🔒 Security Assessment** - Vulnerabilities and protections
6. **⚡ Performance Analysis** - Bottlenecks and optimizations
7. **📋 Recommendations** - Actionable improvement suggestions

### **MCP Tools Utilization**

This agent actively uses all 8 connected MCP servers:
- ✅ **filesystem** - Project structure and code analysis
- ✅ **supabase** - Database schema and function analysis  
- ✅ **shopify-dev-mcp** - E-commerce integration patterns
- ✅ **github** - Repository history and development patterns
- ✅ **sequential-thinking** - Complex workflow analysis
- ✅ **memory** - Relationship mapping and knowledge graphs
- ✅ **playwright** - User interaction flow testing
- ✅ **vercel** - Deployment and performance analysis

## Agent Activation

Simply copy any of the "Execute Now" examples above and paste them as a message to Claude Code CLI. The agent will automatically begin comprehensive analysis using all available MCP tools and generate detailed reports.

This agent transforms static code review into dynamic, AI-powered architectural intelligence leveraging the full MCP ecosystem.