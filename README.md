# Employee Management System - GraphQL API

COMP 3133 Assignment 1. Node.js, Express, GraphQL, MongoDB.

## Setup

- Run `npm install`, then copy `.env.example` to `.env` and set `MONGODB_URI`.
- Start with `npm run dev`. Open http://localhost:4000/ for GraphiQL.

## Sample User

Username: admin | Email: admin@example.com | Password: admin123 (create via Signup first).

## API Overview

8 operations: signup, login, getAllEmployees, addEmployee, getEmployeeByEid, updateEmployeeByEid, deleteEmployeeByEid, getEmployeesByDesignationOrDepartment. Test in GraphiQL at http://localhost:4000/.

## Database

MongoDB database: comp3133_101488793_Assigment1. Collections: users, employees.

## Submission Checklist

MongoDB screenshots, API screenshots (GraphiQL), Sample User, GitHub link, ZIP without node_modules.
