const { GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLSchema, GraphQLList, GraphQLNonNull } = require('graphql');
const User = require('../models/User');
const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
require('dotenv').config(); // Ensure .env is loaded

// Define UserType
const UserType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
        id: { type: GraphQLString },
        username: { type: GraphQLString },
        email: { type: GraphQLString },
        token: { type: GraphQLString }
    })
});

// Define EmployeeType
const EmployeeType = new GraphQLObjectType({
    name: 'Employee',
    fields: () => ({
        id: { type: GraphQLString },
        first_name: { type: GraphQLString },
        last_name: { type: GraphQLString },
        email: { type: GraphQLString },
        gender: { type: GraphQLString },
        designation: { type: GraphQLString },
        salary: { type: GraphQLInt },
        date_of_joining: { type: GraphQLString },
        department: { type: GraphQLString },
        employee_photo: { type: GraphQLString }
    })
});

// Define Root Query
const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        login: {
            type: UserType,
            args: {
              email: { type: new GraphQLNonNull(GraphQLString) },
              password: { type: new GraphQLNonNull(GraphQLString) }
            },
            async resolve(_, args) {
              console.log("🚀 Login request:", args.email);
          
              const user = await User.findOne({ email: args.email });
          
              if (!user) {
                console.error("❌ User not found for email:", args.email);
                throw new Error("User not found");
              }
          
              console.log("✅ User found:", user.email);
          
              const isMatch = await bcrypt.compare(args.password, user.password);
              console.log("🔐 Password match:", isMatch);
          
              if (!isMatch) {
                console.error("❌ Invalid password for user:", user.email);
                throw new Error("Invalid credentials");
              }
          
              if (!process.env.JWT_SECRET) {
                console.error("❌ JWT_SECRET is not defined in .env");
                throw new Error("JWT secret missing");
              }
          
              const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
              console.log("✅ Token generated");
          
              return { ...user._doc, token };
            }
          },
                  
        employees: {
            type: new GraphQLList(EmployeeType),
            async resolve() {
                return Employee.find();
            }
        },
        employeeById: {
            type: EmployeeType,
            args: { id: { type: new GraphQLNonNull(GraphQLString) } },
            async resolve(_, args) {
                return Employee.findById(args.id);
            }
        },
        employeesByDesignation: {
            type: new GraphQLList(EmployeeType),
            args: { designation: { type: new GraphQLNonNull(GraphQLString) } },
            async resolve(_, args) {
                return Employee.find({ designation: args.designation });
            }
        },
        employeesByDepartment: {
            type: new GraphQLList(EmployeeType),
            args: { department: { type: new GraphQLNonNull(GraphQLString) } },
            async resolve(_, args) {
                return Employee.find({ department: args.department });
            }
        }
    }
});

// Define Mutations
const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        signup: {
            type: UserType,
            args: {
                username: { type: new GraphQLNonNull(GraphQLString) },
                email: { type: new GraphQLNonNull(GraphQLString) },
                password: { type: new GraphQLNonNull(GraphQLString) }
            },
            async resolve(_, args) {
                if (!validator.isEmail(args.email)) {
                    throw new Error("Invalid email format");
                }
                if (args.password.length < 8) {
                    throw new Error("Password must be at least 8 characters long");
                }

                const existingUser = await User.findOne({ email: args.email });
                if (existingUser) throw new Error("Email already registered");

                const hashedPassword = await bcrypt.hash(args.password, 10);
                const user = new User({ username: args.username, email: args.email, password: hashedPassword });
                return user.save();
            }
        },
        addEmployee: {
            type: EmployeeType,
            args: {
                first_name: { type: new GraphQLNonNull(GraphQLString) },
                last_name: { type: new GraphQLNonNull(GraphQLString) },
                email: { type: new GraphQLNonNull(GraphQLString) },
                gender: { type: new GraphQLNonNull(GraphQLString) },
                designation: { type: new GraphQLNonNull(GraphQLString) },
                salary: { type: new GraphQLNonNull(GraphQLInt) },
                date_of_joining: { type: new GraphQLNonNull(GraphQLString) },
                department: { type: new GraphQLNonNull(GraphQLString) },
                employee_photo: { type: GraphQLString }
            },
            async resolve(_, args) {
                if (!validator.isEmail(args.email)) {
                    throw new Error("Invalid email format");
                }
                if (args.salary < 1000) {
                    throw new Error("Salary must be at least 1000");
                }

                const validGenders = ["Male", "Female", "Other"];
                if (!validGenders.includes(args.gender)) {
                    throw new Error("Gender must be 'Male', 'Female', or 'Other'");
                }

                const existingEmployee = await Employee.findOne({ email: args.email });
                if (existingEmployee) throw new Error("Employee with this email already exists");

                const employee = new Employee(args);
                return employee.save();
            }
        },
        updateEmployee: {
            type: EmployeeType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLString) },
                first_name: { type: GraphQLString },
                last_name: { type: GraphQLString },
                email: { type: GraphQLString },
                gender: { type: GraphQLString },
                designation: { type: GraphQLString },
                salary: { type: GraphQLInt },
                date_of_joining: { type: GraphQLString },
                department: { type: GraphQLString },
                employee_photo: { type: GraphQLString }
            },
            async resolve(_, args) {
                const updatedEmployee = await Employee.findByIdAndUpdate(args.id, args, { new: true });
                if (!updatedEmployee) throw new Error("Employee not found");
                return updatedEmployee;
            }
        },
        deleteEmployee: {
            type: EmployeeType,
            args: { id: { type: new GraphQLNonNull(GraphQLString) } },
            async resolve(_, args) {
                const deletedEmployee = await Employee.findByIdAndDelete(args.id);
                if (!deletedEmployee) throw new Error("Employee not found");
                return deletedEmployee;
            }
        }
    }
});

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation
});
