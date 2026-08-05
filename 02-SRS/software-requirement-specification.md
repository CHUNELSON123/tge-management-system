# The Green Entrepreneur (TGE) Management System

# Software Requirements Specification (SRS)

---

## Document Information

| Field | Value |
|-------|-------|
| Project Name | The Green Entrepreneur (TGE) Management System |
| Document Title | Software Requirements Specification (SRS) |
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
| 1.1.0 | YYYY-MM-DD | BEH NELSON CHU | Converted to Markdown and updated with Member Business Directory requirements |

---

# Table of Contents

1. Introduction
   - 1.1 Purpose
   - 1.2 Scope
   - 1.3 Definitions, Acronyms and Abbreviations
   - 1.4 References
   - 1.5 Document Overview
2. Overall Description
3. System Features (Functional Requirements)
4. External Interface Requirements
5. Non-Functional Requirements

---

# 1. Introduction

## 1.1 Purpose

The purpose of this Software Requirements Specification (SRS) is to define the functional and non-functional requirements of the proposed The Green Entrepreneur (TGE) Management System. This document serves as the primary reference for stakeholders, developers, designers, testers, and future maintainers throughout the software development life cycle.

The SRS describes the expected behaviour of the system, its major functionalities, user roles, business rules, constraints, and quality attributes. It provides a common understanding of the system requirements and establishes a baseline for system design, implementation, testing, deployment, and maintenance.

The proposed system is intended to support The Green Entrepreneur in managing its members, training programmes, mentoring activities, organisational documents, events, announcements, and administrative operations through a secure web-based platform. It also provides members with a personalised portal where they can access training resources, important documents, organisational communications, and other services relevant to their entrepreneurial journey.

This document is developed based on the organisation's 2026–2028 Strategic Plan and the requirements provided by The Green Entrepreneur's management.

## 1.2 Scope

The Green Entrepreneur (TGE) Management System is a web-based information system developed to support the digital management of the organisation's operational activities. The system provides a central platform for managing members, training programmes, mentoring activities, organisational documents, events, announcements, and administrative functions.

The system enables authorised administrators to efficiently manage organisational resources while providing registered members with secure access to a personalised member portal where they can:

- View training programmes
- Download learning materials
- Download organisational documents
- Receive announcements
- Monitor their participation
- Access resources made available by the organisation

The proposed system is intended to improve operational efficiency, strengthen communication, enhance member engagement, support programme delivery, and provide the digital infrastructure required to achieve the strategic objectives outlined in TGE's 2026–2028 Strategic Plan.

## 1.3 Definitions, Acronyms and Abbreviations

| Term | Definition |
|------|------------|
| TGE | The Green Entrepreneur |
| SRS | Software Requirements Specification |
| Admin | An authorised user responsible for managing the system |
| Member | A registered user of The Green Entrepreneur |
| Mentor | A professional assigned to guide and support members |
| Training Programme | A structured learning programme organised by TGE |
| Cohort | A group of members enrolled in the same training programme |
| Announcement | Information published by administrators for members |
| Document | Organisational or training-related file distributed through the system |
| Dashboard | The personalised interface displayed after user login |
| Role-Based Access Control | A security mechanism that grants permissions according to user roles |
| Authentication | The process of verifying a user's identity before granting access |

## 1.4 References

The development of this Software Requirements Specification is based on the following references:

1. The Green Entrepreneur (TGE) Strategic Plan 2026–2028.
2. Requirements and discussions provided by the President of The Green Entrepreneur.
3. IEEE 29148 – Systems and Software Engineering — Life Cycle Processes — Requirements Engineering.
4. Organisational policies and operational procedures of The Green Entrepreneur where applicable.

## 1.5 Document Overview

This Software Requirements Specification is organised into several chapters.

The Introduction presents the purpose, scope, references, and terminology used throughout the document.

The Overall Description provides an overview of the system, its users, operating environment, assumptions, and constraints.

Subsequent chapters describe the functional requirements, non-functional requirements, external interface requirements, data requirements, business rules, use cases, and acceptance criteria.

Together, these sections provide a complete specification of the proposed The Green Entrepreneur (TGE) Management System.

# 2. Overall Description

## 2.1 Product Perspective

The The Green Entrepreneur (TGE) Management System is a web-based information system designed to support the digital transformation of the organisation's operations.

The system will provide a central platform for managing:

- Members
- Training programmes
- Mentorship activities
- Organisational documents
- Events
- Announcements
- Administrative activities

The platform will provide authorised administrators with tools to manage organisational resources efficiently while giving members access to a personalised portal through which they can view training programmes, download learning materials, access organisational documents, receive announcements, and participate in organisational activities.

The system is designed as a modular platform that can be expanded in future versions to support additional organisational services and business processes.

---

## 2.2 Product Functions

The proposed system shall provide the following major functions:

1. Authentication and Authorisation
2. Member Management
3. Programme and Cohort Management
4. Document and Resource Management
5. Event Management
6. Mentorship Management
7. Communication and Announcement Management
8. Website Content Management
9. Reporting and Analytics
10. System Administration
11. **Member Business Directory Management**

The Member Business Directory enables registered members to showcase their businesses, while allowing visitors and other members to browse business profiles, view business information, and access external business websites or social media platforms where available.

---

## 2.3 User Classes and Characteristics

### System Administrator

Responsible for maintaining the technical operation of the platform, managing user accounts, assigning permissions, monitoring system performance, maintaining security, and performing system maintenance.

---

### Organisation Administrator

Responsible for managing members, programmes, mentors, events, organisational documents, announcements, reports, website content, and approving or managing business listings submitted by members.

---

### Member

Registered members of The Green Entrepreneur who can:

- Access their personalised dashboard.
- View enrolled programmes.
- Download training materials.
- Access organisational documents.
- Receive announcements.
- Participate in organisational activities.
- Create, update, and manage their business profiles within the Member Business Directory.

---

### Mentor

Responsible for mentoring assigned members and monitoring mentoring activities where applicable.

---

### Trainer / Facilitator

Responsible for delivering training programmes, managing learning materials, and monitoring participant engagement.

---

### Visitor

Public users who may:

- Browse organisational information.
- View programmes and events.
- Submit membership enquiries.
- Browse approved businesses listed in the Member Business Directory.

Visitors shall not have access to restricted member resources.

---

## 2.4 Operating Environment

The proposed system shall operate in a web-based environment and be accessible using modern web browsers including:

- Google Chrome
- Microsoft Edge
- Mozilla Firefox
- Apple Safari

The system shall support:

- Desktop computers
- Laptop computers
- Tablets
- Smartphones

through a responsive user interface.

The application shall utilise a cloud-hosted server environment and a relational database management system.

---

## 2.5 Design and Implementation Constraints

The implementation of the proposed system shall consider the following constraints:

1. The system shall comply with the operational requirements of The Green Entrepreneur.
2. User authentication shall be required before accessing protected resources.
3. The system shall implement Role-Based Access Control (RBAC).
4. The application shall be developed as a responsive web application.
5. The architecture shall support future expansion.
6. Organisational data shall be securely stored and protected against unauthorised access.

---

## 2.6 User Documentation

The completed system shall include:

- System Administrator Guide
- Organisation Administrator User Guide
- Member User Guide
- Installation Guide
- API Documentation
- Technical Documentation
- Maintenance Guide

---

## 2.7 Assumptions and Dependencies

The successful operation of the system assumes that:

1. Users have access to devices capable of running modern web browsers.
2. Users have internet connectivity.
3. The organisation provides accurate operational data.
4. Users receive appropriate training where necessary.
5. Hosting infrastructure and database services remain available.
6. The architecture supports future modules and enhancements.
7. Business listings published in the Member Business Directory shall be submitted by registered members and approved by authorised administrators before becoming publicly visible.

# 3.1 Authentication and Authorization Module

## Overview

The Authentication and Authorization Module is responsible for verifying user identities and controlling access to the system based on assigned roles. The module ensures that only authorised users can access protected resources while maintaining the confidentiality and integrity of organisational data.

## Functional Requirements

### FR-AUTH-01
The system shall allow authorised users to log in using their registered email address and password.

### FR-AUTH-02
The system shall validate user credentials before granting access to the system.

### FR-AUTH-03
The system shall deny access when invalid login credentials are provided.

### FR-AUTH-04
The system shall display an appropriate error message when authentication fails.

### FR-AUTH-05
The system shall allow users to securely log out of their accounts.

### FR-AUTH-06
The system shall terminate the user's authenticated session after logout.

### FR-AUTH-07
The system shall allow users to change their passwords after successful authentication.

### FR-AUTH-08
The system shall provide a secure password recovery mechanism using the registered email address.

### FR-AUTH-09
The system shall require users to create passwords that satisfy the organisation's password policy.

### FR-AUTH-10
The system shall encrypt user passwords before storing them in the database.

### FR-AUTH-11
The system shall implement role-based access control.

### FR-AUTH-12
The system shall restrict system features according to the permissions assigned to each user role.

### FR-AUTH-13
The system shall prevent unauthorised users from accessing restricted pages.

### FR-AUTH-14
The system shall maintain an authenticated session until the user logs out or the session expires.

### FR-AUTH-15
The system shall record login activities for security and auditing purposes.

# 3.2 Member Management Module

## Overview

The Member Management Module enables authorised administrators to manage member information while allowing members to maintain their personal profiles through the member portal. The module centralises member records and supports efficient administration of the organisation's membership.

## Functional Requirements

### FR-MEM-01
The system shall allow authorised administrators to register new members.

### FR-MEM-02
The system shall store member information securely in the database.

### FR-MEM-03
The system shall allow authorised administrators to view member information.

### FR-MEM-04
The system shall allow authorised administrators to update member information.

### FR-MEM-05
The system shall allow authorised administrators to deactivate member accounts.

### FR-MEM-06
The system shall allow authorised administrators to reactivate member accounts where applicable.

### FR-MEM-07
The system shall allow administrators to search for members using different search criteria.

### FR-MEM-08
The system shall allow administrators to filter members based on predefined criteria.

### FR-MEM-09
The system shall assign appropriate roles to members according to organisational requirements.

### FR-MEM-10
The system shall maintain complete member profile information.

### FR-MEM-11
The system shall allow members to view their personal profile information.

### FR-MEM-12
The system shall allow members to update permitted profile information.

### FR-MEM-13
The system shall validate member information before saving changes.

### FR-MEM-14
The system shall prevent duplicate member records.

### FR-MEM-15
The system shall maintain the history of member profile updates where applicable.

### FR-MEM-16
The system shall display the current membership status of each member.

### FR-MEM-17
The system shall allow authorised administrators to export member information where required.

### FR-MEM-18
The system shall notify members of significant account-related updates where applicable.

### FR-MEM-19
The system shall maintain the confidentiality of member information according to assigned access permissions.

### FR-MEM-20
The system shall record administrative actions performed on member records for auditing purposes.

# 3.3 Programme and Cohort Management Module

## Overview

The Programme and Cohort Management Module enables authorised administrators to create, organise, manage, and monitor training programmes and cohorts offered by The Green Entrepreneur. The module supports programme planning, participant management, and monitoring of programme delivery.

## Functional Requirements

### FR-PROG-01
The system shall allow authorised administrators to create new training programmes.

### FR-PROG-02
The system shall allow administrators to update programme information.

### FR-PROG-03
The system shall allow administrators to deactivate or archive programmes.

### FR-PROG-04
The system shall allow administrators to create cohorts for training programmes.

### FR-PROG-05
The system shall assign members to specific cohorts.

### FR-PROG-06
The system shall allow administrators to remove members from cohorts where necessary.

### FR-PROG-07
The system shall display programme information to authorised users.

### FR-PROG-08
The system shall display cohort information to authorised users.

### FR-PROG-09
The system shall maintain programme schedules.

### FR-PROG-10
The system shall allow administrators to assign trainers to programmes.

### FR-PROG-11
The system shall allow administrators to assign mentors where applicable.

### FR-PROG-12
The system shall maintain participant enrolment records.

### FR-PROG-13
The system shall allow members to view their enrolled programmes.

### FR-PROG-14
The system shall allow members to view programme schedules.

### FR-PROG-15
The system shall display programme progress where applicable.

### FR-PROG-16
The system shall maintain programme status information.

### FR-PROG-17
The system shall allow administrators to search training programmes.

### FR-PROG-18
The system shall allow administrators to filter programme records.

### FR-PROG-19
The system shall maintain historical programme information.

### FR-PROG-20
The system shall record programme management activities for auditing purposes.

# 3.4 Document and Resource Management Module

## Overview

The Document and Resource Management Module enables authorised administrators to upload, organise, manage, and distribute organisational and training documents while allowing members to securely access and download resources relevant to their programmes.

## Functional Requirements

### FR-DOC-01
The system shall allow authorised administrators to upload organisational documents.

### FR-DOC-02
The system shall allow administrators to upload training materials.

### FR-DOC-03
The system shall allow administrators to organise documents into appropriate categories.

### FR-DOC-04
The system shall allow administrators to update document information.

### FR-DOC-05
The system shall allow administrators to replace existing documents with updated versions.

### FR-DOC-06
The system shall allow administrators to archive documents that are no longer active.

### FR-DOC-07
The system shall allow administrators to delete documents where authorised.

### FR-DOC-08
The system shall allow administrators to define access permissions for documents.

### FR-DOC-09
The system shall display documents according to user permissions.

### FR-DOC-10
The system shall allow members to browse available documents.

### FR-DOC-11
The system shall allow members to search for documents.

### FR-DOC-12
The system shall allow members to download authorised documents.

### FR-DOC-13
The system shall display document details before download.

### FR-DOC-14
The system shall maintain document version information where applicable.

### FR-DOC-15
The system shall maintain document categories for efficient organisation.

### FR-DOC-16
The system shall validate uploaded files before storing them.

### FR-DOC-17
The system shall restrict access to confidential documents.

### FR-DOC-18
The system shall maintain document availability for authorised users.

### FR-DOC-19
The system shall maintain a history of document management activities.

### FR-DOC-20
The system shall record document upload, update, and deletion activities for auditing purposes.

# 3.5 Event Management Module

## Overview

The Event Management Module enables authorised administrators to create, organise, manage, and monitor events conducted by The Green Entrepreneur. The module supports workshops, seminars, networking sessions, competitions, webinars, and other organisational activities while allowing members to view upcoming events and participate where applicable.

## Functional Requirements

### FR-EVT-01
The system shall allow authorised administrators to create new events.

### FR-EVT-02
The system shall allow administrators to update event information.

### FR-EVT-03
The system shall allow administrators to cancel events where necessary.

### FR-EVT-04
The system shall allow administrators to publish event information.

### FR-EVT-05
The system shall allow administrators to define event schedules.

### FR-EVT-06
The system shall allow administrators to specify event venues or online meeting information.

### FR-EVT-07
The system shall allow administrators to assign facilitators or speakers to events.

### FR-EVT-08
The system shall allow administrators to register participants for events.

### FR-EVT-09
The system shall allow members to view available events.

### FR-EVT-10
The system shall allow members to register for events where registration is required.

### FR-EVT-11
The system shall allow members to cancel their event registration where permitted.

### FR-EVT-12
The system shall display event details including date, time, venue, and description.

### FR-EVT-13
The system shall notify members of newly published events.

### FR-EVT-14
The system shall notify registered participants of event updates.

### FR-EVT-15
The system shall maintain attendance records for completed events.

### FR-EVT-16
The system shall allow administrators to view event participants.

### FR-EVT-17
The system shall allow administrators to generate event participation reports.

### FR-EVT-18
The system shall maintain historical event records.

### FR-EVT-19
The system shall maintain event status information.

### FR-EVT-20
The system shall record all event management activities for auditing purposes.

# 3.6 Mentorship Management Module

## Overview

The Mentorship Management Module enables authorised administrators to manage mentors, assign mentors to members, monitor mentoring activities, and support effective knowledge sharing throughout the organisation's programmes.

## Functional Requirements

### FR-MENT-01
The system shall allow authorised administrators to register mentors.

### FR-MENT-02
The system shall allow administrators to update mentor information.

### FR-MENT-03
The system shall allow administrators to deactivate mentor accounts where necessary.

### FR-MENT-04
The system shall allow administrators to assign mentors to members.

### FR-MENT-05
The system shall allow administrators to reassign mentors when required.

### FR-MENT-06
The system shall allow administrators to remove mentor assignments.

### FR-MENT-07
The system shall allow mentors to view their assigned members.

### FR-MENT-08
The system shall allow mentors to access relevant information about assigned members.

### FR-MENT-09
The system shall allow mentors to record mentoring activities.

### FR-MENT-10
The system shall allow mentors to record mentoring notes where authorised.

### FR-MENT-11
The system shall allow administrators to monitor mentoring activities.

### FR-MENT-12
The system shall allow administrators to view mentor assignments.

### FR-MENT-13
The system shall allow administrators to search mentor records.

### FR-MENT-14
The system shall allow administrators to filter mentor information.

### FR-MENT-15
The system shall maintain mentoring schedules where applicable.

### FR-MENT-16
The system shall notify mentors of new assignments.

### FR-MENT-17
The system shall notify members when mentors are assigned.

### FR-MENT-18
The system shall maintain historical mentoring records.

### FR-MENT-19
The system shall generate mentorship reports where required.

### FR-MENT-20
The system shall record all mentorship management activities for auditing purposes.

# 3.7 Communication and Announcement Management Module

## Overview

The Communication and Announcement Management Module enables authorised administrators to communicate important information to members through announcements, notifications, and organisational updates. The module ensures timely dissemination of information regarding programmes, events, organisational activities, and other relevant communications.

## Functional Requirements

### FR-COM-01
The system shall allow authorised administrators to create announcements.

### FR-COM-02
The system shall allow administrators to edit announcements before publication.

### FR-COM-03
The system shall allow administrators to publish announcements.

### FR-COM-04
The system shall allow administrators to archive announcements.

### FR-COM-05
The system shall allow administrators to remove announcements where necessary.

### FR-COM-06
The system shall display published announcements to authorised users.

### FR-COM-07
The system shall allow members to view current announcements.

### FR-COM-08
The system shall display announcement details including title, content, publication date, and author where applicable.

### FR-COM-09
The system shall allow administrators to categorise announcements.

### FR-COM-10
The system shall notify members when new announcements are published.

### FR-COM-11
The system shall allow administrators to send notifications to selected members or groups.

### FR-COM-12
The system shall maintain notification history.

### FR-COM-13
The system shall display unread notifications to members.

### FR-COM-14
The system shall allow members to mark notifications as read.

### FR-COM-15
The system shall allow administrators to schedule announcements for future publication.

### FR-COM-16
The system shall maintain communication records.

### FR-COM-17
The system shall allow administrators to search announcements.

### FR-COM-18
The system shall allow administrators to filter announcements.

### FR-COM-19
The system shall maintain historical announcement records.

### FR-COM-20
The system shall record all communication and announcement management activities for auditing purposes.

# 3.8 Website Content Management Module

## Overview

The Website Content Management Module enables authorised administrators to manage the public content displayed on The Green Entrepreneur (TGE) website. This module ensures that visitors have access to accurate, up-to-date, and relevant information about the organisation, its programmes, events, partners, and other public activities.

## Functional Requirements

### FR-CMS-01

The system shall allow authorised administrators to create website pages.

### FR-CMS-02

The system shall allow administrators to update website pages.

### FR-CMS-03

The system shall allow administrators to publish website content.

### FR-CMS-04

The system shall allow administrators to unpublish website content.

### FR-CMS-05

The system shall allow administrators to delete website pages where authorised.

### FR-CMS-06

The system shall allow administrators to manage homepage content.

### FR-CMS-07

The system shall allow administrators to manage organisational information displayed on the website.

### FR-CMS-08

The system shall allow administrators to manage programme information displayed on the website.

### FR-CMS-09

The system shall allow administrators to manage event information displayed on the website.

### FR-CMS-10

The system shall allow administrators to manage news and announcements displayed on the public website.

### FR-CMS-11

The system shall allow administrators to upload website images and media resources.

### FR-CMS-12

The system shall validate uploaded website media before publication.

### FR-CMS-13

The system shall display only published content to public visitors.

### FR-CMS-14

The system shall allow administrators to organise website content into categories.

### FR-CMS-15

The system shall support search engine friendly content where applicable.

### FR-CMS-16

The system shall maintain version history of website content where applicable.

### FR-CMS-17

The system shall allow administrators to schedule content publication.

### FR-CMS-18

The system shall allow administrators to archive outdated website content.

### FR-CMS-19

The system shall maintain historical website content records.

### FR-CMS-20

The system shall record all website content management activities for auditing purposes.

# 3.9 Member Business Directory Module

## Overview

The Member Business Directory Module enables registered members of **The Green Entrepreneur (TGE)** to showcase their businesses through a central online directory managed by the organisation. The module promotes entrepreneurship by increasing the visibility of member-owned businesses while allowing visitors, potential customers, partners, and investors to discover businesses within the TGE community.

Business listings shall be reviewed and approved by authorised administrators before becoming publicly visible to ensure the accuracy, credibility, and quality of information published on the platform.

## Functional Requirements

### FR-BIZ-01

The system shall allow registered members to create business profiles.

### FR-BIZ-02

The system shall allow members to update their business profiles.

### FR-BIZ-03

The system shall allow members to upload a business logo.

### FR-BIZ-04

The system shall allow members to upload business images.

### FR-BIZ-05

The system shall allow members to provide business information including:

- Business Name
- Business Category
- Business Description
- Contact Information
- Business Address (Optional)

### FR-BIZ-06

The system shall allow members to provide business contact details including:

- Telephone Number
- Email Address
- Website

### FR-BIZ-07

The system shall allow members to provide links to social media platforms including:

- Facebook
- Instagram
- LinkedIn
- X (Twitter)
- TikTok
- YouTube
- WhatsApp

### FR-BIZ-08

The system shall allow members to submit business profiles for administrator approval.

### FR-BIZ-09

The system shall allow authorised administrators to approve business listings.

### FR-BIZ-10

The system shall allow authorised administrators to reject business listings with comments.

### FR-BIZ-11

The system shall allow administrators to suspend or deactivate business listings.

### FR-BIZ-12

The system shall allow administrators to permanently remove business listings where necessary.

### FR-BIZ-13

The system shall display only approved business listings on the public website.

### FR-BIZ-14

The system shall provide a searchable Member Business Directory.

### FR-BIZ-15

The system shall allow visitors and members to search businesses using keywords.

### FR-BIZ-16

The system shall allow visitors and members to filter businesses by category.

### FR-BIZ-17

The system shall display detailed business profiles containing approved business information.

### FR-BIZ-18

The system shall allow visitors to open external business websites and social media pages from the business profile.

### FR-BIZ-19

The system shall maintain the status of every business listing, including:

- Pending
- Approved
- Rejected
- Suspended

### FR-BIZ-20

The system shall record all business management activities for auditing purposes.

# 3.10 Reporting and Analytics Module

## Overview

The Reporting and Analytics Module enables authorised administrators to monitor organisational performance by generating reports on members, programmes, mentors, events, business listings, and other operational activities. The module supports informed decision-making by providing timely and accurate organisational information.

## Functional Requirements

### FR-RPT-01

The system shall allow authorised administrators to generate member reports.

### FR-RPT-02

The system shall allow administrators to generate programme reports.

### FR-RPT-03

The system shall allow administrators to generate cohort participation reports.

### FR-RPT-04

The system shall allow administrators to generate event participation reports.

### FR-RPT-05

The system shall allow administrators to generate mentorship reports.

### FR-RPT-06

The system shall allow administrators to generate document usage reports.

### FR-RPT-07

The system shall allow administrators to generate announcement and communication reports.

### FR-RPT-08

The system shall allow administrators to generate reports on Member Business Directory listings.

### FR-RPT-09

The system shall allow administrators to filter reports using predefined criteria.

### FR-RPT-10

The system shall allow administrators to search generated reports.

### FR-RPT-11

The system shall allow administrators to export reports in supported formats.

### FR-RPT-12

The system shall display dashboard statistics summarising organisational activities.

### FR-RPT-13

The system shall display programme participation statistics.

### FR-RPT-14

The system shall display member registration statistics.

### FR-RPT-15

The system shall display business listing statistics.

### FR-RPT-16

The system shall maintain historical reporting data.

### FR-RPT-17

The system shall support trend analysis using historical organisational data.

### FR-RPT-18

The system shall provide reporting information only to authorised users.

### FR-RPT-19

The system shall ensure the integrity and accuracy of generated reports.

### FR-RPT-20

The system shall record report generation activities for auditing purposes.

# 3.11 System Administration Module

## Overview

The System Administration Module enables authorised system administrators to configure, monitor, maintain, and secure the overall operation of the The Green Entrepreneur (TGE) Management System. The module provides administrative tools for managing users, roles, permissions, system settings, audit logs, and other platform-wide configurations.

## Functional Requirements

### FR-ADM-01

The system shall allow authorised system administrators to manage user accounts.

### FR-ADM-02

The system shall allow system administrators to create user roles.

### FR-ADM-03

The system shall allow system administrators to update user roles.

### FR-ADM-04

The system shall allow system administrators to delete user roles where permitted.

### FR-ADM-05

The system shall allow system administrators to assign roles to users.

### FR-ADM-06

The system shall allow system administrators to manage system permissions.

### FR-ADM-07

The system shall allow system administrators to configure system settings.

### FR-ADM-08

The system shall allow system administrators to manage organisational information.

### FR-ADM-09

The system shall allow system administrators to activate or deactivate user accounts.

### FR-ADM-10

The system shall allow system administrators to reset user passwords where authorised.

### FR-ADM-11

The system shall maintain complete audit logs of system activities.

### FR-ADM-12

The system shall allow system administrators to view system audit logs.

### FR-ADM-13

The system shall allow system administrators to search audit records.

### FR-ADM-14

The system shall allow system administrators to filter audit records.

### FR-ADM-15

The system shall record login and logout activities.

### FR-ADM-16

The system shall maintain system error logs.

### FR-ADM-17

The system shall allow authorised administrators to perform database backup operations.

### FR-ADM-18

The system shall allow authorised administrators to restore system data from approved backups.

### FR-ADM-19

The system shall monitor overall system health and operational status.

### FR-ADM-20

The system shall ensure that all administrative activities are securely logged for accountability and auditing purposes.

---

# 3.12 Requirements Traceability Matrix (RTM)

The Requirements Traceability Matrix establishes the relationship between the business requirements identified in the Project Planning Document (PPD) and the functional modules defined in this Software Requirements Specification (SRS). It ensures that every business requirement is addressed by one or more functional requirements and supports verification, validation, testing, and future system maintenance.

| Business Requirement | Description | Supporting Functional Module(s) |
|----------------------|-------------|---------------------------------|
| BR-01 | Manage member information | Member Management |
| BR-02 | Secure member authentication | Authentication and Authorization |
| BR-03 | Provide access to training programmes | Programme and Cohort Management |
| BR-04 | Manage organisational documents | Document and Resource Management |
| BR-05 | Publish announcements | Communication and Announcement Management |
| BR-06 | Manage programmes | Programme and Cohort Management |
| BR-07 | Manage organisational events | Event Management |
| BR-08 | Manage mentorship activities | Mentorship Management |
| BR-09 | Monitor member participation | Reporting and Analytics |
| BR-10 | Generate organisational reports | Reporting and Analytics |
| BR-11 | Implement role-based access control | Authentication and Authorization, System Administration |
| BR-12 | Support future organisational growth | System Administration |
| BR-13 | Members manage business profiles | Member Business Directory |
| BR-14 | Searchable Member Business Directory | Member Business Directory |
| BR-15 | Display business information | Member Business Directory |
| BR-16 | Administrator approval of business listings | Member Business Directory |
| BR-17 | Browse approved business listings | Member Business Directory |
| BR-18 | Manage business profile updates | Member Business Directory |
| BR-19 | Audit business listing activities | Member Business Directory |

# 4. External Interface Requirements

## 4.1 User Interface

The The Green Entrepreneur (TGE) Management System shall provide a responsive and user-friendly web interface that supports efficient interaction between users and the system.

### UI-01

The system shall provide a responsive interface that adapts to desktop computers, laptops, tablets, and smartphones.

### UI-02

The system shall provide a secure login interface for authorised users.

### UI-03

The system shall provide personalised dashboards according to user roles.

### UI-04

The system shall provide intuitive navigation throughout the application.

### UI-05

The system shall provide consistent page layouts and navigation components.

### UI-06

The system shall provide appropriate validation messages for invalid user input.

### UI-07

The system shall display confirmation messages after successful operations.

### UI-08

The system shall display meaningful error messages when operations fail.

### UI-09

The system shall provide searchable and filterable data tables where applicable.

### UI-10

The system shall provide an accessible Member Business Directory where visitors and members can browse approved business listings.

---

## 4.2 Hardware Interfaces

The proposed system shall operate using standard computing devices and shall not require specialised hardware.

Supported devices include:

- Desktop computers
- Laptop computers
- Tablets
- Smartphones

The server infrastructure shall support the hosting requirements of the application.

---

## 4.3 Software Interfaces

The proposed system shall interface with the following software components:

- Web Browser
- Application Server
- Database Management System
- Email Service
- File Storage Service

Where applicable, the system may integrate with external services for notifications, authentication, and future organisational requirements.

---

## 4.4 Communication Interfaces

Communication between system components shall occur using secure internet protocols.

The system shall support:

- HTTPS
- RESTful APIs
- JSON data exchange

All communication between the client application and server shall be encrypted using HTTPS in production environments.

---

## 4.5 Database Interface

The system shall interact with a relational database management system to store and retrieve organisational information.

The database shall support:

- Member records
- Training programmes
- Documents
- Events
- Mentorship records
- Announcements
- Business listings
- Reports
- Audit logs

Database access shall be restricted to authorised application services.

# 5. Non-Functional Requirements

## 5.1 Performance Requirements

### NFR-PERF-01

The system shall respond to user requests within an acceptable response time under normal operating conditions.

### NFR-PERF-02

The system shall support multiple concurrent users without significant degradation in performance.

### NFR-PERF-03

The system shall optimise database queries to minimise response time.

### NFR-PERF-04

The system shall efficiently manage uploaded documents, media files, and business images.

### NFR-PERF-05

The system shall support future growth in users, programmes, documents, events, and business listings without requiring major architectural changes.

---

## 5.2 Security Requirements

### NFR-SEC-01

The system shall authenticate users before granting access to protected resources.

### NFR-SEC-02

The system shall implement Role-Based Access Control (RBAC).

### NFR-SEC-03

User passwords shall be securely encrypted before storage.

### NFR-SEC-04

The system shall protect confidential organisational and member information from unauthorised access.

### NFR-SEC-05

The system shall validate all user input before processing.

### NFR-SEC-06

The system shall maintain audit logs for critical system activities.

### NFR-SEC-07

The system shall ensure that only approved business listings are visible to public visitors.

### NFR-SEC-08

Communication between the client and server shall use HTTPS in production.

---

## 5.3 Reliability Requirements

### NFR-REL-01

The system shall provide consistent operation under normal working conditions.

### NFR-REL-02

The system shall minimise service interruptions through proper error handling.

### NFR-REL-03

The system shall maintain data integrity during normal operation.

### NFR-REL-04

The system shall support data backup and recovery procedures.

---

## 5.4 Availability Requirements

### NFR-AVL-01

The system shall be available whenever authorised users require access, except during scheduled maintenance.

### NFR-AVL-02

Scheduled maintenance activities shall be communicated to users in advance where applicable.

---

## 5.5 Usability Requirements

### NFR-USA-01

The user interface shall be simple, intuitive, and easy to navigate.

### NFR-USA-02

The system shall provide consistent navigation throughout the application.

### NFR-USA-03

The system shall provide meaningful validation and error messages.

### NFR-USA-04

The system shall support responsive access across desktop computers, laptops, tablets, and smartphones.

### NFR-USA-05

The Member Business Directory shall provide simple browsing, searching, and filtering capabilities for visitors and members.

---

## 5.6 Maintainability Requirements

### NFR-MNT-01

The system shall follow a modular software architecture.

### NFR-MNT-02

The source code shall be organised to support future maintenance.

### NFR-MNT-03

The system shall support future functional enhancements without significant redesign.

### NFR-MNT-04

Technical documentation shall be maintained throughout the software life cycle.

---

## 5.7 Scalability Requirements

### NFR-SCL-01

The system architecture shall support organisational growth.

### NFR-SCL-02

The platform shall support the addition of future modules and services.

### NFR-SCL-03

The system shall support increasing numbers of members, programmes, documents, events, and business listings.

---

## 5.8 Compatibility Requirements

### NFR-CMP-01

The system shall support modern web browsers including Google Chrome, Microsoft Edge, Mozilla Firefox, and Apple Safari.

### NFR-CMP-02

The system shall provide a consistent user experience across supported browsers.

---

## 5.9 Backup and Recovery Requirements

### NFR-BKP-01

The system shall support regular database backups.

### NFR-BKP-02

The system shall provide mechanisms for restoring authorised backups.

### NFR-BKP-03

Backup operations shall preserve data integrity.

---

# Appendix A — Acronyms

| Acronym | Meaning |
|----------|---------|
| TGE | The Green Entrepreneur |
| SRS | Software Requirements Specification |
| PPD | Project Planning Document |
| SDD | Software Design Document |
| RBAC | Role-Based Access Control |
| API | Application Programming Interface |
| UI | User Interface |
| HTTPS | Hypertext Transfer Protocol Secure |
| DBMS | Database Management System |

---

# Appendix B — References

1. The Green Entrepreneur (TGE) Strategic Plan 2026–2028.
2. Project Planning Document (PPD).
3. Software Design Document (SDD).
4. IEEE 29148 – Systems and Software Engineering — Requirements Engineering.
5. Discussions and requirements provided by the Board of The Green Entrepreneur.

---

# End of Document