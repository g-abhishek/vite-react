/**
 * 🎨 What Is a UML Diagram?
 * UML stands for Unified Modeling Language.
 * 
 * A UML diagram is a visual way to represent the structure or behavior of a software system. 
 * It’s like a blueprint for your code — helping developers, designers, and stakeholders understand how different parts of a system interact, even before any code is written.
 * 
 * ================================================================================================
 * 🧱 Why Use UML?
 * - To visualize how your software is structured.
 * - To communicate ideas between team members clearly.
 * - To design object-oriented systems before implementation.
 * - To document existing systems for analysis or maintenance.
 */

// ================================================================================================
/**
 * 🧩 Types of UML Diagrams (High-Level Categories)
 * UML has 14 types of diagrams (😅) — but you really only need to start with a few:
 *
 * ================================================================================================
 * 
 * 1. Class Diagram 📦 (Most commonly used)
 * - Shows classes, their attributes, and relationships.
 * - Great for designing OOP (object-oriented programming) systems.
 * 
    +-------------+       +-------------+
    |   Animal    |       |   Dog       |
    +-------------+       +-------------+
    | - name      |<------| - breed     |
    | - age       |       +-------------+
    +-------------+       | +bark()     |
    | +eat()      |       +-------------+
    | +sleep()    |
    +-------------+

 * 🔁 This says: Dog inherits from Animal.
 *
 * ================================================================================================
 * 
 * 2. Sequence Diagram ⏱
 * - Shows how objects interact in a time-based sequence (like calling functions).
 * - Useful for workflows, method calls, or APIs.
 * 
+-------------+       +-------------+       +-------------+
|   User      |       |   Auth      |       |   Server    |
+-------------+       +-------------+       +-------------+
| - username   |       | - token     |       | - response  |
| - password   |       +-------------+       +-------------+
+-------------+       | +login()    |       | +sendData() |
| +request()   |<---->| +validate() |<----->| +receive()  |
+-------------+       +-------------+       +-------------+
 *
    User → Controller → Service → Database
 *
 * ================================================================================================
 * 
 * 3. Use Case Diagram 👥
 * - Shows who can do what in the system.
 * - Useful for capturing system functionality from a user's perspective.
 *        
+-------------+       +-------------+
|   User      |       |   System    |
+-------------+       +-------------+
| - name      |       | - features  |
| - role      |       +-------------+
+-------------+       | +login()    |
| +perform()  |<----->| +logout()   |
+-------------+       | +register() |
                     +-------------+
 * 
[User] -- (Login)
       -- (Upload file)
       -- (Download report)
 * 
 */


/**
 * ✅ Why Developers Love UML
 * - Helps plan architecture before coding
 * - Makes it easier to refactor or scale
 * - Provides clear documentation
 * - Improves team communication
 */