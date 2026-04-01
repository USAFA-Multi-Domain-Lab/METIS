---
agent: agent
description: Add a new field to the Mission model and ensure it is properly integrated into the system.
---

**IMPORTANT** This checklist is a guide. If you deviate from it, or if you identify an issue or concern, please REPORT IT to the user for further instructions on how to proceed. NEVER PROCEED WITHOUT CONFIRMATION.

Checklist:
[] Add the field requested in the prompt to the Mission model with the specifications provided in the prompt.
[] Ensure the field is added into the appropriate mission-component class in the shared folder. Maintain the order of the fields across the code base (i.e if in the model the order is name, icon, order, then it should be the same in the mission component class and any other relevant places).
[] Ensure proper serialization and deserialization of the new field via JSON-related methods, properties, interfaces, and types.
[] Ensure API endpoints are up-to-date to properly handle the new field, namely the create and update mission endpoints.
[] Check for compilation errors in shared, server, client, test, and integration folders, since they each have their own independent TypeScript configurations.
[] Prompt user whether they would like to add migration scripting for this new field and how they would like to go about it. It is possible that they would like a new migration script or they may want to modify the latest one, if relevant. Either way, reference the migrations instruction file when managing these scripts.
