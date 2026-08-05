# The Green Entrepreneur (TGE) Management System

# Software Design Document (SDD)

---

## Document Information

| Field | Value |
|-------|-------|
| Project Name | The Green Entrepreneur (TGE) Management System |
| Document Title | Software Design Document (SDD) |
| Version | 1.1.0 |
| Status | Draft |
| Author | BEH NELSON CHU |
| Reviewer | Pending |
| Approver | Pending |
| Created Date | YYYY-MM-DD |
| Last Updated | YYYY-MM-DD |

---

# Revision History

| Version | Date | Author | Description |
|----------|------|--------|-------------|
| 1.0.0 | YYYY-MM-DD | BEH NELSON CHU | Initial Draft |
| 1.1.0 | YYYY-MM-DD | BEH NELSON CHU | Converted to Markdown and updated with Member Business Directory design |

---

# Table of Contents

1. Introduction
   - 1.1 Purpose
   - 1.2 Scope
   - 1.3 Intended Audience
   - 1.4 References
   - 1.5 Design Goals
2. System Architecture
3. System Component Design
4. Database Design
5. UML Design
6. API Design
7. User Interface Design
8. Deployment and Security Design

---

# Chapter 1: Introduction

## 1.1 Purpose

The purpose of this Software Design Document (SDD) is to describe the architectural and technical design of the proposed The Green Entrepreneur (TGE) Management System. The document translates the approved Software Requirements Specification (SRS) into a comprehensive technical blueprint that guides the implementation, testing, deployment, and maintenance of the system.

It defines the system architecture, software components, database structure, user interface design, application programming interfaces (APIs), deployment environment, and security mechanisms required to implement the proposed solution. The document serves as the primary technical reference for software developers, system architects, testers, and future maintainers throughout the software development life cycle.

---

## 1.2 Scope

This document covers the technical design of the The Green Entrepreneur (TGE) Management System. It describes the overall system architecture, software modules, database design, user interface structure, API design, deployment architecture, and security considerations.

The design presented in this document is based on the approved Software Requirements Specification (SRS) and supports the operational needs identified in The Green Entrepreneur's Strategic Plan 2026–2028.

The Software Design Document does not redefine the system requirements but explains how those requirements will be implemented using modern software engineering principles and technologies.

---

## 1.3 Intended Audience

This document is intended for:

- Software Developers
- Software Architects
- Database Designers
- UI/UX Designers
- System Testers
- Project Managers
- Future System Maintainers
- The Green Entrepreneur Management (for design review)

---

## 1.4 References

The design described in this document is based on the following references:

1. The Green Entrepreneur (TGE) Strategic Plan 2026–2028.
2. Project Planning Document (PPD).
3. Software Requirements Specification (SRS).
4. IEEE 1016 – Systems Design Description.
5. IEEE 29148 – Systems and Software Engineering – Requirements Engineering.

---

## 1.5 Design Goals

The design of the The Green Entrepreneur (TGE) Management System is guided by the following objectives:

- Develop a modular and scalable software architecture.
- Ensure high system security through authentication and role-based access control.
- Improve maintainability by separating system responsibilities into independent modules.
- Provide a responsive and intuitive user experience across multiple devices.
- Support future organisational growth through an extensible architecture.
- Promote code reusability, consistency, and maintainability.
- Ensure reliable management of organisational data and digital resources.
- Facilitate integration with future technologies and third-party services where required.

# Chapter 2: System Architecture

## 2.1 Architectural Overview

The The Green Entrepreneur (TGE) Management System adopts a three-tier layered architecture, separating the Presentation Layer, Application Layer, and Data Layer. This architectural approach promotes separation of concerns, maintainability, scalability, and ease of future enhancement.

The architecture enables users to access the system through a web browser while business logic is processed by the application server and organisational data is securely stored within a relational database. Each layer performs specific responsibilities and communicates only with adjacent layers, reducing system complexity and improving software quality.

The proposed architecture also supports modular development, allowing individual modules such as Member Management, Programme Management, Event Management, Mentorship Management, Document Management, **Member Business Directory Management**, and Reporting to evolve independently without significantly affecting other components of the system.

The architecture is designed to support future integration with additional services such as mobile applications, payment gateways, learning platforms, and third-party APIs while maintaining the integrity of the existing system.

---

## 2.2 Architectural Style

The proposed system adopts a Layered Architecture based on the principles of Separation of Concerns (SoC).

The architecture consists of the following layers.

### Presentation Layer

The Presentation Layer provides the user interface through which visitors, members, mentors, administrators, and system administrators interact with the application. It is responsible for displaying information, collecting user input, validating client-side data, and communicating with the Application Layer through secure HTTP requests.

### Application Layer

The Application Layer contains the business logic of the system. It processes user requests, validates business rules, performs application-specific operations, coordinates communication between software modules, and interacts with the Data Layer.

### Data Access Layer

The Data Access Layer manages communication between the Application Layer and the database. It is responsible for data retrieval, insertion, updating, deletion, transaction management, and enforcing database integrity through the Object-Relational Mapping (ORM) framework.

### Database Layer

The Database Layer provides persistent storage for all organisational information, including members, programmes, cohorts, mentors, documents, events, announcements, **business listings**, reports, and system configuration data.

---

## 2.3 Architectural Design Principles

The design of the proposed system is guided by the following software engineering principles.

### Modularity

The system is divided into independent modules, each responsible for a specific business function.

### Separation of Concerns

User interface logic, business logic, and data access are implemented in separate layers to improve maintainability.

### Scalability

The architecture supports the addition of new modules and services without requiring major architectural changes.

### Reusability

Common services and software components are designed for reuse across multiple modules.

### Security by Design

Authentication, authorisation, input validation, encryption, and auditing are incorporated into the system architecture from the outset.

### Maintainability

The architecture promotes clean code organisation, making future maintenance and enhancements easier.

### Extensibility

The system can accommodate future requirements, integrations, and technological improvements with minimal impact on existing functionality.

---

## 2.4 High-Level System Architecture

The proposed The Green Entrepreneur (TGE) Management System follows a client-server architecture implemented using a three-tier layered design. The system is composed of four primary components that work together to deliver secure and efficient services to users.

### Client Layer

The Client Layer consists of users accessing the system through modern web browsers on desktop computers, laptops, tablets, or smartphones. The client provides the user interface for visitors, members, mentors, administrators, and system administrators.

### Presentation Layer

The Presentation Layer is responsible for rendering the user interface, validating user input, and communicating with the application server through secure HTTPS requests.

This layer provides two primary interfaces:

- Public Website
- Member Portal

### Application Layer

The Application Layer contains the core business logic of the system. It processes user requests, applies business rules, manages authentication and authorisation, coordinates communication between software modules, and interacts with the database layer.

The Application Layer includes the following software modules:

- Authentication and Authorization
- Member Management
- Programme and Cohort Management
- Document and Resource Management
- Event Management
- Mentorship Management
- Communication and Announcements Management
- Website Content Management
- **Member Business Directory Management**
- Reporting and Analytics
- System Administration

### Data Layer

The Data Layer manages persistent organisational data. It stores:

- Member information
- Programme records
- Documents
- Mentoring information
- Events
- Announcements
- Business listings
- Reports
- System configuration
- Other organisational resources

The layer also manages data integrity, transactions, and secure data retrieval.

---

## 2.5 Component Interaction

The interaction between the major components of the proposed system follows the sequence below.

1. A user accesses the system through the public website or the member portal.
2. The Presentation Layer validates user input before transmitting requests to the Application Layer.
3. The Application Layer authenticates the user, validates business rules, and determines the requested operation.
4. Where necessary, the Application Layer communicates with the Data Layer to retrieve or update organisational data.
5. The Data Layer returns the requested information to the Application Layer.
6. The Application Layer processes the returned information and prepares an appropriate response.
7. The Presentation Layer displays the processed information to the user through the web interface.

This interaction ensures a clear separation of responsibilities between the user interface, business logic, and data management components while promoting maintainability, scalability, and system security.

---

## 2.6 Technology Stack

The proposed The Green Entrepreneur (TGE) Management System will be implemented using modern web technologies selected for their reliability, scalability, maintainability, and strong community support.

| Layer | Proposed Technology |
|--------|---------------------|
| Frontend | Next.js with TypeScript |
| User Interface | React, Tailwind CSS, shadcn/ui |
| Backend | Node.js with Express.js |
| Database | PostgreSQL |
| ORM | Prisma ORM |
| Authentication | JWT with secure password hashing and role-based access control |
| File Storage | Cloud-based object storage |
| Email Service | SMTP or Transactional Email Service |
| API Architecture | RESTful API |
| Version Control | Git and GitHub |
| Deployment | Cloud-hosted Web Application |

# Chapter 3: System Component Design

## 3.1 Authentication and Authorization Component

### Purpose

The Authentication and Authorization Component is responsible for verifying user identities and controlling access to system resources. It ensures that only authenticated and authorised users can access protected features based on their assigned roles.

### Responsibilities

The component shall:

- Authenticate users during login.
- Verify user credentials.
- Manage user sessions.
- Authorise access based on user roles.
- Handle password changes and password recovery.
- Protect restricted system resources.
- Record authentication activities for auditing purposes.

### Inputs

The component receives:

- User login credentials.
- Password reset requests.
- Password change requests.
- Session validation requests.
- Role verification requests.

### Outputs

The component provides:

- Authentication status.
- User session information.
- Access tokens or authenticated sessions.
- User role information.
- Authentication error messages.
- Audit log entries.

### Dependencies

This component interacts with:

- Member Management Component
- System Administration Component
- Database Layer
- Email Service (for password recovery)

### Internal Workflow

1. User submits login credentials.
2. System validates the submitted information.
3. Credentials are verified against stored user records.
4. User permissions are determined based on assigned roles.
5. An authenticated session is created.
6. The user is redirected to the appropriate dashboard.
7. Authentication activities are recorded in the audit log.

---

## 3.2 Member Management Component

### Purpose

The Member Management Component manages the complete lifecycle of members within The Green Entrepreneur (TGE) Management System. It provides administrators with tools to manage member records while enabling members to maintain their personal profiles and access services available through the member portal.

### Responsibilities

The component shall:

- Register and manage member accounts.
- Maintain member profile information.
- Manage member status.
- Display personalised member dashboards.
- Maintain programme participation history.
- Provide secure access to member information.
- Support member search and filtering.

### Inputs

The component receives:

- Member registration information.
- Profile update requests.
- Search requests.
- Dashboard requests.
- Administrative management requests.

### Outputs

The component provides:

- Member profiles.
- Dashboard information.
- Member status information.
- Programme participation records.
- Search results.
- Administrative reports.

### Dependencies

This component interacts with:

- Authentication and Authorization Component
- Programme and Cohort Management Component
- Document and Resource Management Component
- Communication and Announcements Component
- **Member Business Directory Component**
- Reporting and Analytics Component
- Database Layer

### Internal Workflow

1. Administrator creates or manages a member account.
2. Member information is validated.
3. Member data is stored in the database.
4. Members authenticate using the Authentication Component.
5. The personalised dashboard is generated.
6. Member activities are recorded for reporting and auditing purposes.

---

## 3.3 Programme and Cohort Management Component

### Purpose

The Programme and Cohort Management Component manages the lifecycle of TGE's entrepreneurial programmes and cohorts. It supports programme creation, cohort administration, participant enrolment, scheduling, learning resource management, and programme monitoring.

### Responsibilities

The component shall:

- Manage programmes and cohorts.
- Enrol members into programmes.
- Maintain programme schedules.
- Manage programme resources.
- Monitor programme participation.
- Track programme progress.
- Maintain programme history.

### Inputs

The component receives:

- Programme information.
- Cohort information.
- Member enrolment requests.
- Programme schedules.
- Learning resources.

### Outputs

The component provides:

- Programme details.
- Cohort information.
- Enrolment records.
- Programme schedules.
- Participation statistics.
- Programme reports.

### Dependencies

This component interacts with:

- Member Management Component
- Document and Resource Management Component
- Communication and Announcements Component
- Reporting and Analytics Component
- Database Layer

### Internal Workflow

1. Administrator creates a programme.
2. Cohorts are created for the programme.
3. Members are enrolled into appropriate cohorts.
4. Learning resources are published.
5. Programme activities are monitored.
6. Participation data is forwarded to the Reporting Component.

---

## 3.4 Document and Resource Management Component

### Purpose

The Document and Resource Management Component provides secure storage, organisation, and distribution of organisational and programme-related resources.

### Responsibilities

The component shall:

- Manage digital documents.
- Organise learning resources.
- Control document access.
- Manage document versions.
- Maintain document metadata.
- Record document activities.

### Inputs

The component receives:

- Document uploads.
- Resource updates.
- Search requests.
- Download requests.
- Access requests.

### Outputs

The component provides:

- Downloadable resources.
- Search results.
- Document metadata.
- Access status.
- Activity records.

### Dependencies

This component interacts with:

- Programme and Cohort Management Component
- Member Management Component
- Communication and Announcements Component
- Database Layer
- Cloud Storage Service

### Internal Workflow

1. Administrator uploads a resource.
2. Resource information is validated.
3. Resource is stored securely.
4. Members access authorised resources.
5. Download activities are recorded.

## 3.5 Communication and Reporting Services

### Purpose

The Communication and Reporting Services coordinate organisational communication and provide management with operational information required for decision-making.

### Responsibilities

The services shall:

- Publish announcements.
- Send notifications.
- Deliver email communications.
- Generate organisational reports.
- Produce dashboards.
- Monitor organisational performance.
- Maintain communication history.

### Inputs

The services receive:

- Announcements.
- Email requests.
- Event updates.
- Programme updates.
- Reporting requests.
- Dashboard requests.

### Outputs

The services provide:

- Notifications.
- Email messages.
- Reports.
- Dashboards.
- Performance statistics.
- KPI summaries.

### Dependencies

These services interact with:

- Member Management Component
- Programme and Cohort Management Component
- Event Management Module
- Mentorship Management Module
- **Member Business Directory Component**
- Database Layer
- Email Service

### Internal Workflow

1. Administrator publishes information.
2. Target recipients are identified.
3. Notifications are generated.
4. Email messages are dispatched where applicable.
5. Organisational data is analysed.
6. Reports and dashboards are generated.

---

## 3.6 Member Business Directory Component

### Purpose

The Member Business Directory Component enables registered members of The Green Entrepreneur (TGE) to create, manage, and promote their businesses through a central online business directory. It also enables visitors, members, partners, and potential customers to discover businesses within the TGE community.

### Responsibilities

The component shall:

- Manage business profiles.
- Store business information.
- Manage business categories.
- Manage business logos and gallery images.
- Manage business contact information.
- Manage website and social media links.
- Submit business listings for approval.
- Approve or reject business listings.
- Publish approved businesses.
- Support business search and filtering.
- Record business management activities for auditing.

### Inputs

The component receives:

- Business registration information.
- Business profile update requests.
- Business logo uploads.
- Business image uploads.
- Business approval requests.
- Business search requests.
- Business category selections.

### Outputs

The component provides:

- Published business profiles.
- Business search results.
- Business directory listings.
- Business approval status.
- Business management reports.
- Audit log entries.

### Dependencies

This component interacts with:

- Member Management Component
- Authentication and Authorization Component
- Communication and Reporting Services
- System Administration Component
- Database Layer
- Cloud Storage Service

### Internal Workflow

1. Member creates a business profile.
2. Business information is validated.
3. Business details and uploaded media are stored.
4. The business is submitted for administrative review.
5. An administrator reviews the submission.
6. The business is approved or rejected.
7. Approved businesses become visible in the public Business Directory.
8. All business management activities are recorded for auditing purposes.

---

## 3.7 System Administration Component

### Purpose

The System Administration Component provides the operational tools required to configure, secure, monitor, and maintain the TGE Management System.

### Responsibilities

The component shall:

- Manage users and roles.
- Configure system settings.
- Monitor system health.
- Manage audit logs.
- Perform backup and recovery operations.
- Maintain security settings.
- Support system maintenance.

### Inputs

The component receives:

- Administrative commands.
- User management requests.
- Configuration updates.
- Backup requests.
- Audit log queries.

### Outputs

The component provides:

- Updated configurations.
- User account information.
- Audit reports.
- Backup status.
- System monitoring information.
- Security logs.

### Dependencies

This component interacts with all other system components and the underlying database.

### Internal Workflow

1. Administrator accesses administrative tools.
2. The requested administrative operation is validated.
3. The configuration or management task is executed.
4. Audit information is recorded.
5. Updated system information is presented to the administrator.

# Chapter 4: Database Design

## 4.1 Database Overview

The database of the The Green Entrepreneur (TGE) Management System is designed to provide secure, reliable, and structured storage of organisational information. It serves as the central repository for all operational data required to support member management, programme administration, mentoring activities, event management, document distribution, communication, reporting, **member business directory management**, and system administration.

The database adopts a relational model to ensure data integrity, minimise redundancy, and support efficient retrieval of information. Relationships between entities are implemented using primary and foreign key constraints to maintain referential integrity and consistency across the system.

The database is designed to support future organisational growth by allowing additional entities and relationships to be incorporated without major structural redesign.

---

## 4.2 Database Design Principles

The database design follows established relational database design principles to ensure maintainability, consistency, and scalability.

The following principles guide the database design:

- Data normalisation to minimise redundancy.
- Use of primary keys to uniquely identify records.
- Use of foreign keys to maintain referential integrity.
- Enforcement of entity relationships through database constraints.
- Secure storage of sensitive organisational information.
- Scalability to support future organisational growth.
- Efficient indexing of frequently accessed data.
- Auditability through timestamps and activity records.
- Consistent naming conventions across all database objects.

---

## 4.3 Entity Identification

The proposed The Green Entrepreneur (TGE) Management System is centred around several core business entities. Each entity represents an important object within the organisation's operations and forms the foundation of the database design.

The primary entities identified for the system are:

| Entity | Description |
|---------|-------------|
| User | Stores authentication credentials and basic account information for all system users. |
| Role | Defines user roles and permissions within the system. |
| Member | Stores detailed information about registered TGE members. |
| **Business** | Stores businesses owned by registered members, including profile information, contact details, category, approval status, website links, and social media information. |
| Mentor | Stores information about mentors participating in the mentoring programme. |
| Programme | Represents TGE programmes such as TGE Foundation, Young Entrepreneur, The Entrepreneur, and Personalized Support. |
| Cohort | Represents a specific intake or group of participants within a programme. |
| Enrollment | Records member enrolment into programme cohorts. |
| Event | Stores organisational events such as workshops, networking sessions, webinars, and competitions. |
| Event Registration | Records member participation in organisational events. |
| Resource | Stores learning materials and organisational resources available to members. |
| Resource Category | Organises resources into logical categories. |
| Announcement | Stores announcements published by administrators. |
| Notification | Stores notifications delivered to members and other authorised users. |
| Mentoring Session | Records mentoring meetings, objectives, notes, and progress. |
| Website Page | Stores editable content displayed on the public website. |
| News Article | Stores news, updates, and public publications. |
| Audit Log | Records significant system activities for security and auditing purposes. |

---

## 4.4 Entity Relationship Diagram (ERD)

The Entity Relationship Diagram (ERD) provides a graphical representation of the relationships between the entities identified for the The Green Entrepreneur (TGE) Management System. The ERD illustrates how organisational data is structured and how different entities interact to support the system's functional requirements.

The database is designed using a relational model in which each entity is uniquely identified by a primary key. Relationships between entities are established through foreign keys to ensure referential integrity and minimise data redundancy.

The primary relationships within the database include:

- A Role may be assigned to many Users, while each User is assigned one Role.
- A User may have one associated Member profile.
- A User may have one associated Mentor profile.
- **A Member may own multiple Businesses, while each Business belongs to one Member.**
- A Programme may contain multiple Cohorts.
- A Cohort may contain multiple Enrollments.
- A Member may have multiple Enrollments, while each Enrollment belongs to one Member and one Cohort.
- A Programme may contain multiple Resources.
- A Category may classify multiple Resources.
- A Member may register for multiple Events through Event Registration.
- A Mentor may supervise multiple Mentor Assignments.
- A Member may receive multiple Mentor Assignments.
- A Mentor Assignment may have multiple Mentoring Sessions.
- An Administrator may publish multiple Announcements.
- A User may receive multiple Notifications.
- An Administrator may create multiple Pages and News articles.
- All significant system activities shall be recorded in the Audit Log.

The complete Entity Relationship Diagram is presented in the following section and serves as the foundation for the physical database design.

---

## 4.5 Entity Descriptions

This section provides a description of each entity identified for the The Green Entrepreneur (TGE) Management System. These entities collectively support the organisation's operational processes and serve as the foundation of the database design.

### User

Represents all authenticated users of the system, including system administrators, organisation administrators, members, and mentors. The entity stores account credentials and basic authentication information.

### Role

Defines the roles available within the system and determines the level of access granted to users. Examples include System Administrator, Organisation Administrator, Member, and Mentor.

### Permission

Represents the access rights associated with different system roles. Permissions determine which system functions users are authorised to perform.

### Member

Stores detailed information about registered members of The Green Entrepreneur, including personal information and profile details required for participation in organisational programmes.

### Business

Represents businesses owned by registered members. The entity stores business profile information, category, contact information, website, social media links, business logo, gallery images, approval status, and publication status for the Member Business Directory.

### Programme

Represents entrepreneurial programmes offered by The Green Entrepreneur, such as TGE Foundation, Young Entrepreneur, The Entrepreneur, and Personalized Support.

### Cohort

Represents a specific intake or group of participants enrolled in a programme during a defined period.

### Enrollment

Represents the relationship between members and programme cohorts. It records enrolment information, participation status, and programme history.

### Resource

Represents digital learning materials and organisational resources made available to members through the platform.

### Category

Represents classifications used to organise resources into logical groups for easier management and retrieval.

### Event

Represents organisational activities such as workshops, seminars, networking events, webinars, competitions, and information sessions.

### Event Registration

Represents a member's registration and participation in a specific organisational event.

### Mentor

Stores information about mentors participating in TGE's mentorship programme, including their expertise and contact details.

### Mentor Assignment

Represents the assignment of mentors to members for personalised entrepreneurial support.

### Mentoring Session

Represents individual mentoring meetings conducted between mentors and assigned members, including session records and progress information.

### Announcement

Represents organisational announcements published for members and other authorised users through the platform.

### Notification

Represents system-generated notifications delivered to users regarding announcements, programmes, events, mentoring activities, business approvals, and other important updates.

### Audit Log

Stores records of significant user and system activities to support auditing, monitoring, troubleshooting, and security.

### Page

Represents editable pages displayed on the public website, including informational content such as About Us, Programmes, Contact, Business Directory, and other website pages.

### News

Represents news articles, organisational updates, success stories, and public announcements published on the organisation's website.

## 4.6 Relationship Descriptions

This section describes the relationships between the entities of the The Green Entrepreneur (TGE) Management System. These relationships define how organisational data is connected and ensure data consistency throughout the database.

### Role – User Relationship

A Role may be assigned to many Users, while each User is assigned one Role.

**Relationship Type:** One-to-Many (1:M)

---

### User – Member Relationship

A User may have one associated Member profile, and each Member profile belongs to one User account.

**Relationship Type:** One-to-One (1:1)

---

### User – Mentor Relationship

A User may have one associated Mentor profile, and each Mentor profile belongs to one User account.

**Relationship Type:** One-to-One (1:1)

---

### Member – Business Relationship

A Member may own multiple Businesses, while each Business belongs to one Member.

This relationship enables registered members to manage one or more businesses through the Member Business Directory.

**Relationship Type:** One-to-Many (1:M)

---

### Programme – Cohort Relationship

A Programme may consist of multiple Cohorts, while each Cohort belongs to one Programme.

**Relationship Type:** One-to-Many (1:M)

---

### Cohort – Enrollment Relationship

A Cohort may have many Enrollment records, while each Enrollment belongs to one Cohort.

**Relationship Type:** One-to-Many (1:M)

---

### Member – Enrollment Relationship

A Member may have multiple Enrollment records, while each Enrollment belongs to one Member.

This relationship enables members to participate in different programmes or cohorts over time.

**Relationship Type:** One-to-Many (1:M)

---

### Category – Resource Relationship

A Category may contain multiple Resources, while each Resource belongs to one Category.

**Relationship Type:** One-to-Many (1:M)

---

### Programme – Resource Relationship

A Programme may have multiple learning Resources, while each Resource is associated with one Programme.

**Relationship Type:** One-to-Many (1:M)

---

### Event – Event Registration Relationship

An Event may have many Event Registration records, while each Event Registration belongs to one Event.

**Relationship Type:** One-to-Many (1:M)

---

### Member – Event Registration Relationship

A Member may register for multiple Events, while each Event Registration belongs to one Member.

This relationship resolves the many-to-many relationship between Members and Events.

**Relationship Type:** One-to-Many (1:M)

---

### Mentor – Mentor Assignment Relationship

A Mentor may supervise multiple Mentor Assignments, while each Mentor Assignment belongs to one Mentor.

**Relationship Type:** One-to-Many (1:M)

---

### Member – Mentor Assignment Relationship

A Member may receive multiple Mentor Assignments during their participation in different programmes, while each Mentor Assignment belongs to one Member.

**Relationship Type:** One-to-Many (1:M)

---

### Mentor Assignment – Mentoring Session Relationship

A Mentor Assignment may have multiple Mentoring Sessions, while each Mentoring Session belongs to one Mentor Assignment.

**Relationship Type:** One-to-Many (1:M)

---

### User – Announcement Relationship

A User (Administrator) may publish multiple Announcements, while each Announcement is published by one User.

**Relationship Type:** One-to-Many (1:M)

---

### User – Notification Relationship

A User may receive multiple Notifications, while each Notification belongs to one User.

**Relationship Type:** One-to-Many (1:M)

---

### User – Page Relationship

A User (Administrator) may create and manage multiple Pages, while each Page is created by one User.

**Relationship Type:** One-to-Many (1:M)

---

### User – News Relationship

A User (Administrator) may publish multiple News articles, while each News article is published by one User.

**Relationship Type:** One-to-Many (1:M)

---

### User – Audit Log Relationship

A User may generate multiple Audit Log records, while each Audit Log entry is associated with one User.

**Relationship Type:** One-to-Many (1:M)

---

# 4.7 Database Constraints

Database constraints are rules applied to the database to ensure the accuracy, consistency, and integrity of stored data. The proposed The Green Entrepreneur (TGE) Management System shall implement the following constraints.

## Primary Key Constraints

Each entity shall have a unique primary key that uniquely identifies every record within the corresponding database table.

---

## Foreign Key Constraints

Relationships between entities shall be implemented using foreign keys to maintain referential integrity. A foreign key value must reference an existing primary key in the related table.

---

## Unique Constraints

Unique constraints shall be applied where duplicate values are not permitted.

Examples include:

- User email addresses
- Programme names (where applicable)
- Role names
- Category names
- Business names where required by organisational policy

---

## NOT NULL Constraints

Mandatory fields shall not accept null values.

Examples include:

- User email
- Password
- Role identifier
- Member full name
- Programme name
- Cohort name
- Event title
- Business name
- Business category
- Business approval status

---

## Check Constraints

Check constraints shall be used to ensure that field values satisfy predefined conditions.

Examples include:

- Event end date must not precede the event start date.
- Programme duration must be greater than zero.
- User status shall contain only predefined values (e.g., Active, Inactive, Suspended).
- Resource file size shall comply with the maximum upload limit.
- Business approval status shall contain only predefined values (Pending, Approved, Rejected, Suspended).

---

## Default Value Constraints

Where appropriate, default values shall be assigned automatically.

Examples include:

- Record creation date and time.
- User account status.
- Notification read status.
- Business approval status (Pending).
- Audit log timestamp.

---

## Referential Integrity Constraints

The system shall maintain referential integrity between related tables. Records that are referenced by other entities shall not be deleted in a manner that creates orphan records. Where necessary, cascading update and deletion rules shall be implemented according to the system's business requirements.

---

## Data Integrity Constraints

The system shall validate data before it is stored in the database to ensure completeness, consistency, and accuracy. Invalid or incomplete data shall be rejected with appropriate validation messages before database transactions are completed.

---

# 4.8 Data Dictionary

The Data Dictionary provides a high-level description of the entities that make up the database of the The Green Entrepreneur (TGE) Management System. It serves as a reference for understanding the purpose of each entity before implementation of the physical database schema.

| Entity | Primary Key | Description |
|---------|------------|-------------|
| User | user_id | Stores user authentication credentials and account information for all authorised users. |
| Role | role_id | Defines user roles and access levels within the system. |
| Permission | permission_id | Defines permissions that control access to system functions. |
| Member | member_id | Stores detailed information about registered members. |
| **Business** | **business_id** | **Stores member-owned businesses published through the Member Business Directory.** |
| Programme | programme_id | Stores information about entrepreneurial programmes offered by TGE. |
| Cohort | cohort_id | Represents programme intakes or participant groups. |
| Enrollment | enrollment_id | Records member enrolment into programme cohorts. |
| Resource | resource_id | Stores learning materials and organisational resources. |
| Category | category_id | Classifies resources into logical categories. |
| Event | event_id | Stores organisational event information. |
| Event Registration | registration_id | Records member registrations for organisational events. |
| Mentor | mentor_id | Stores mentor information and professional details. |
| Mentor Assignment | assignment_id | Records mentor assignments to members. |
| Mentoring Session | session_id | Stores mentoring session details, notes, and progress records. |
| Announcement | announcement_id | Stores organisational announcements published to users. |
| Notification | notification_id | Stores notifications generated by the system. |
| Audit Log | audit_log_id | Records significant user and system activities for auditing purposes. |
| Page | page_id | Stores editable public website pages. |
| News | news_id | Stores news articles and public organisational updates. |

The detailed physical database schema, including table columns, data types, indexes, constraints, and relationships, will be implemented during the database development phase in accordance with this logical data dictionary.

# Chapter 5: UML Design

## 5.1 UML Overview

Unified Modeling Language (UML) is a standard visual modelling language used to represent the structure and behaviour of software systems. The UML diagrams presented in this chapter provide a graphical representation of the proposed The Green Entrepreneur (TGE) Management System from different perspectives.

The UML models complement the Software Requirements Specification (SRS) and the Software Design Document (SDD) by illustrating the interactions between users and the system, the relationships between system components, the flow of business processes, and the structure of the application's classes.

The UML diagrams developed for the proposed system include:

- Use Case Diagram
- Use Case Specifications
- Activity Diagrams
- Sequence Diagrams
- Class Diagram

These diagrams serve as implementation guides during software development and provide a common understanding of the system for developers, testers, and stakeholders.

---

## 5.2 Use Case Diagram

The Use Case Diagram illustrates the interactions between external actors and the proposed The Green Entrepreneur (TGE) Management System. It identifies the services provided by the system and the users who interact with those services.

### Actors

The primary actors of the system are:

- Visitor
- Member
- Mentor
- Organisation Administrator
- System Administrator

### Major Use Cases

#### Visitor

- View website information
- View programmes
- View events
- View news
- **Browse Business Directory**
- **View Business Profile**
- Contact the organisation

#### Member

- Log in
- Manage profile
- View dashboard
- View enrolled programmes
- Access learning resources
- Download documents
- Register for events
- View announcements
- View notifications
- View mentoring information
- **Create Business Profile**
- **Manage Business Profile**
- **Submit Business for Approval**
- Log out

#### Mentor

- Log in
- View assigned members
- Schedule mentoring sessions
- Record mentoring notes
- View mentoring history
- Log out

#### Organisation Administrator

- Manage members
- Manage programmes
- Manage cohorts
- Manage resources
- Manage events
- Manage mentors
- Manage announcements
- Manage website content
- **Approve Business Listings**
- **Manage Business Directory**
- View reports
- Manage notifications

#### System Administrator

- Manage users
- Manage roles
- Manage permissions
- Configure system settings
- Monitor audit logs
- Perform backups
- Maintain system security

---

## 5.3 Use Case Specifications

The Use Case Specifications provide a detailed description of the major interactions between the system actors and the The Green Entrepreneur (TGE) Management System. Each specification describes the objective of the use case, the actors involved, the preconditions, the normal flow of events, alternative flows, exceptions, and the expected outcome.

The following major use cases have been identified for the proposed system:

- User Login
- Manage Members
- Manage Programmes and Cohorts
- Manage Resources
- Manage Events
- Manage Mentorship
- Manage Announcements
- **Manage Member Business Directory**
- Manage Website Content
- Generate Reports
- Manage Users and Roles

Detailed specifications for these use cases are presented after the corresponding Use Case Diagram.

---

## 5.4 Activity Diagrams

Activity Diagrams illustrate the workflow of major business processes within the The Green Entrepreneur (TGE) Management System. These diagrams describe the sequence of activities performed by users and the system when executing important operations.

The Activity Diagrams developed for the proposed system include:

- User Authentication Process
- Member Registration Process
- Programme Enrollment Process
- Resource Upload and Distribution Process
- Event Registration Process
- Mentorship Management Process
- Announcement Publication Process
- **Business Listing Approval Process**
- Report Generation Process

These diagrams provide a clear understanding of business workflows and support the implementation of system functionality.

---

## 5.5 Sequence Diagrams

Sequence Diagrams illustrate the interaction between system actors and software components over time. They demonstrate how requests are processed by the system and how different components collaborate to complete specific operations.

The Sequence Diagrams developed for the proposed system include:

- User Login
- Member Enrollment
- Resource Access
- Event Registration
- Mentorship Session Management
- Announcement Publication
- **Business Registration and Approval**
- Report Generation

These diagrams provide developers with a detailed understanding of message flow between system components during runtime.

---

## 5.6 Class Diagram

The Class Diagram represents the static structure of the The Green Entrepreneur (TGE) Management System. It identifies the primary classes, their attributes, operations, and the relationships that exist between them.

The Class Diagram is derived from the entities identified during database design and serves as the foundation for implementing the application's domain model. It also supports object-oriented software development by illustrating inheritance, associations, aggregations, and dependencies between software classes.

The Class Diagram shall include the following primary domain classes:

- User
- Role
- Permission
- Member
- **Business**
- Mentor
- Programme
- Cohort
- Enrollment
- Resource
- Category
- Event
- Event Registration
- Mentor Assignment
- Mentoring Session
- Announcement
- Notification
- Page
- News
- Audit Log

The complete Class Diagram is presented in the following section.

# Chapter 6: API Design

## 6.1 API Architecture

The The Green Entrepreneur (TGE) Management System shall implement a RESTful API architecture to facilitate communication between the frontend application and the backend services.

The API shall expose secure endpoints for managing:

- Authentication
- Members
- Programmes
- Resources
- Events
- Mentorship
- Announcements
- **Member Business Directory**
- Reports
- Administrative functions

---

## 6.2 Authentication Strategy

API access shall be secured using authenticated user sessions or access tokens.

All protected endpoints shall require successful user authentication before processing requests.

Role-Based Access Control (RBAC) shall be enforced to ensure users can only access resources authorised for their assigned roles.

---

## 6.3 API Standards

The API shall conform to the following standards:

- RESTful architecture
- JSON request and response format
- HTTPS communication
- Standard HTTP status codes
- Consistent endpoint naming conventions
- Versioned API structure

---

## 6.4 Endpoint Categories

The API shall be organised into the following categories:

- Authentication API
- User API
- Member API
- Programme API
- Cohort API
- Resource API
- Event API
- Mentor API
- Announcement API
- Notification API
- **Business API**
- Report API
- Administration API

---

## 6.5 Request and Response Format

The API shall exchange data using JSON.

Each request shall include the required parameters and authentication information where applicable.

Each response shall return:

- Status code
- Response message
- Requested data
- Error information (where applicable)

### Example Response

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}
```

### Example Error Response

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": []
}
```

---

## 6.6 Error Handling

The API shall return meaningful error messages using standard HTTP response codes.

Examples include:

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 6.7 Business API Endpoints

The Member Business Directory shall expose dedicated REST API endpoints to manage business listings.

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/businesses` | Retrieve approved business listings |
| GET | `/api/businesses/{id}` | Retrieve a specific business profile |
| POST | `/api/businesses` | Create a new business profile |
| PUT | `/api/businesses/{id}` | Update an existing business profile |
| DELETE | `/api/businesses/{id}` | Delete a business profile |
| GET | `/api/businesses/search` | Search businesses |
| GET | `/api/businesses/category/{category}` | Retrieve businesses by category |
| PATCH | `/api/businesses/{id}/approve` | Approve a business listing |
| PATCH | `/api/businesses/{id}/reject` | Reject a business listing |
| PATCH | `/api/businesses/{id}/suspend` | Suspend a business listing |

Business management endpoints shall require authentication and appropriate authorisation, while public browsing endpoints shall be accessible to visitors for approved business listings only.

# Chapter 7: User Interface Design

## 7.1 User Interface Overview

The The Green Entrepreneur (TGE) Management System shall provide a responsive, modern, and intuitive web interface that supports desktop, tablet, and mobile devices.

The interface shall consist of three major sections:

- Public Website
- Member Portal
- Administration Portal

The user interface is designed to provide a consistent user experience across all supported devices while ensuring accessibility, usability, and efficient navigation.

---

## 7.2 Navigation Structure

### Public Website

The Public Website shall include:

- Home
- About Us
- Programmes
- Events
- News
- **Business Directory**
- Contact Us
- Login

The Business Directory page shall allow visitors to:

- Browse approved businesses
- Search businesses
- Filter businesses by category
- View business profiles
- Access business websites and social media links where available

---

### Member Portal

The Member Portal shall include:

- Dashboard
- My Profile
- My Programmes
- Learning Resources
- Documents
- Events
- Mentorship
- Announcements
- Notifications
- **My Businesses**
- Settings

The My Businesses page shall allow members to:

- Create business profiles
- Edit business information
- Upload business logos and images
- Submit businesses for approval
- View approval status
- Manage published businesses

---

### Administration Portal

The Administration Portal shall include:

- Dashboard
- Member Management
- Programme Management
- Cohort Management
- Resource Management
- Event Management
- Mentorship Management
- Website Content Management
- **Business Directory Management**
- Reports
- User Management
- System Settings

The Business Directory Management section shall allow administrators to:

- View all submitted businesses
- Review pending business submissions
- Approve business listings
- Reject business listings
- Suspend business listings
- Delete business listings
- Search businesses
- Filter businesses
- View business statistics

---

## 7.3 Wireframes

The detailed wireframes for the Public Website, Member Portal, and Administration Portal shall be developed during the user interface design phase and shall guide implementation.

The wireframes shall include, but are not limited to:

### Public Website

- Home Page
- About Us
- Programmes
- Events
- News
- Business Directory
- Business Profile
- Contact Us
- Login

### Member Portal

- Dashboard
- Profile
- My Programmes
- Learning Resources
- Documents
- Events
- Mentorship
- Announcements
- Notifications
- My Businesses
- Create Business
- Edit Business

### Administration Portal

- Dashboard
- Member Management
- Programme Management
- Resource Management
- Event Management
- Mentorship Management
- Website Content Management
- Business Directory Management
- Reports
- User Management
- System Settings

The wireframes shall define page layouts, navigation flow, forms, tables, dashboards, and interactive components required for implementing the user interface.

# Chapter 8: Deployment and Security Design

## 8.1 Deployment Architecture

The proposed The Green Entrepreneur (TGE) Management System shall be deployed as a cloud-hosted web application consisting of the following components:

- Client Application
- Web Server
- Application Server
- Database Server
- File Storage Service
- Email Service

The deployment architecture shall support secure communication between all system components while providing scalability, reliability, and maintainability.

The deployed application shall support:

- Public Website
- Member Portal
- Administration Portal
- Member Business Directory

---

## 8.2 Security Design

The system shall implement multiple layers of security to protect organisational data, member information, and business listings from unauthorised access.

The following security mechanisms shall be implemented:

- User Authentication
- Role-Based Access Control (RBAC)
- Password Encryption
- HTTPS Communication
- Input Validation
- Audit Logging
- Secure File Storage
- Session Management

Additional security measures for the Member Business Directory include:

- Business listings shall only be published after administrator approval.
- Members shall only manage businesses they own.
- Uploaded business images shall be validated before storage.
- Business profile updates shall be recorded for auditing purposes.
- Public users shall only view approved business listings.

---

## 8.3 Backup and Recovery

The system shall support regular database backups and authorised data restoration procedures.

The backup strategy shall include:

- Scheduled database backups.
- Secure backup storage.
- Backup verification procedures.
- Recovery testing.
- Disaster recovery planning.

Business Directory data, uploaded logos, and business images shall be included in the backup strategy to ensure complete restoration when required.

---

## 8.4 System Maintenance

The architecture shall support future software updates, maintenance activities, performance monitoring, and the addition of new modules without major redesign.

Routine maintenance activities shall include:

- Software updates.
- Database optimisation.
- Security patch management.
- Performance monitoring.
- Log management.
- Backup verification.
- System health monitoring.

The modular architecture shall enable future enhancements, including additional services for the Member Business Directory, without affecting existing system functionality.

---

# Conclusion

The Software Design Document (SDD) defines the technical architecture and implementation approach for the proposed The Green Entrepreneur (TGE) Management System. It provides a comprehensive design covering the system architecture, software components, database design, UML models, API architecture, user interface design, and deployment strategy.

The addition of the **Member Business Directory** extends the platform by enabling registered members to promote their businesses while providing visitors with a central location to discover businesses within The Green Entrepreneur community. The feature integrates seamlessly with the existing modular architecture and supports the organisation's objective of promoting entrepreneurship and increasing the visibility of member-owned businesses.

This Software Design Document serves as the primary technical reference for developers, testers, and future maintainers during the implementation and evolution of the system.