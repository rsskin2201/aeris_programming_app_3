# **App Name**: AERIS

## Core Features:

- Inspection Request Forms: Provides role-based forms for requesting inspections, including individual PES (Puesta en Servicio), mass PES, and special (non-PES) inspection types.
- Role-Based Access Control: Enforces distinct access levels and permissions for each user role: Empresa Colaboradora, Gestor de Expansión, Empresa de Control de Calidad, Soporte a Procesos, Canales, Visual User, and Administrator. This includes module visibility and data modification rights.
- Inspection Scheduling Calendar: A calendar view displaying inspection schedules with month, week, and day views. Includes filters for segmenting data and export functionality to .csv format. Admin override for weekend scheduling is also enabled.
- Record Management: Allows users to view and modify inspection records (based on role permissions). Records can be exported to .csv format, or filters can be applied for refined segmenting of data. Editing and viewing are role-dependent.
- Entity Management: Provides CRUD (Create, Read, Update, Delete) functionality for managing entities such as Empresas Colaboradoras, Instaladores, Gestores de Expansión, Empresas de Control de Calidad, Inspectores, and Sectores. Includes enable/disable and edit options.
- User Management: Allows administrators to manage user accounts, reset passwords, and assign roles and zone permissions. Includes a user creation form with role and zone selection. Passwords are automatically generated upon creation.
- Data Visualization Dashboard: Presents a dashboard of key metrics and KPIs related to inspection data for Visual User role (managers and directors). Enables data extraction for reporting and analysis.

## Style Guidelines:

- Primary color: Sky blue (#87CEEB), evoking trust and clarity.
- Background color: Light gray (#F0F0F0), providing a neutral and clean backdrop.
- Accent color: Soft green (#98FB98), highlighting key actions and important data points.
- Headline Font: 'Poppins', sans-serif, provides a modern, clean and readable feel. This font would be appropriate for headings.
- Body Font: 'PT Sans', sans-serif, will complement Poppins and is suitable for the forms, detail lists, and the calendar views
- Use a set of consistent icons, conveying ease of understanding.
- Employs a card-based layout to clearly present all modules.
- Introduce subtle, smooth transitions for loading screens and user interface updates to enhance the user experience.