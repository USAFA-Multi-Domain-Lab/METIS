# changelog

# version-2.2.3 | 11-7-2025

- Enhanced user validation to support longer usernames (5-50 characters) and allow hyphens in first and last names.
- Updated bulk user management scripts for improved database connection handling and error handling.
- Improved user list tooltips to display username-specific information on hover.

# version-2.2.2 | 10-3-2025

- Target environments now support data stores. These data stores will allow developers to cache random-access data between script executions.
- Loggers now support log rotation, preventing log files from growing indefinitely.
- The server now supports running with the HTTPS protocol in production, using SSL certificates defined in the .env files.
- Documentation has been greatly expanded to provide more details on the use of METIS.
- Fixed an issue where effects would be inaccessible when viewing a mission in read-only mode.
- CLI has been updated to support managing METIS as a service on Linux.
- The session management system has been refactored to handle duplicate client connections and to resolve race conditions in the session store.
- An issue was fixed with mission duplication where properties from the original document were not properly transferred.
- Administrators were previously unable to tear down sessions they did not own. This was unintended and has been resolved.

# version-2.2.1 | 8-14-2025

- An issue was fixed with mission exports where exported files would only be cleaned up on server shutdown, causing unnecessary drive space usage. Mission export files are now automatically deleted once the user has downloaded them (note: this means downloads cannot be restarted by refreshing the page).
- Minor fix was applied to the button context menu.

# version-2.2.0 | 8-12-2025

- A new auto-focus feature was implemented, which in certain situations, will automatically pan the mission map to a particular node.
- User preferences are now supported, allowing for a more personalized experience in the future.
- Support for single-use actions has been added. Now a drop-down is available to define whether an action can be executed once or multiple times.
- The initial block status for a node can now be configured. This means that a node can be blocked from the start of a mission.
- A visual distinction has been made between directly blocked nodes and indirectly blocked nodes.
- The logout option in the navigation has been replaced with an option to view the user's profile.
- A load bar has been added to help show the progress of events throughout the application, namely file uploads.
- Presets are now available for quickly creating common effects.
- Converted hard-coded, success/failure text to utilize the target-effect system, while maintaining the existing functionality.
- Clarification was added to the METIS target environment title and description to highlight its purpose of creating internal effects only.
- Performed various bug fixes and improvements.

# version-2.1.1 | 7-9-2025

- An issue has been fixed regard mission imports. Importing a mission would assign the system as the creator of the mission, rather than the user who imported it.
- An issue regarding mission import migration has been resolved.
- A display issue resulting in inconsistent spacing at the bottom of the page has been fixed.
- Issues pertaining to the handling of effects have been resolved, specifically issues with how the client and server handled effects enacted on nodes that were not yet revealed in a given force.
- A visual issue with how relationship lines on the mission map were rendered has been fixed.
- Launching a mission would update both the last-launched and last-updated timestamps. Now only the last-launched timestamp is updated.
- The list of defects in a mission would not properly display to the user when launching a mission.

# version-2.1.0 | 7-3-2025

- Full file store support has been implemented, enabling users to upload, manage, and download files, attach them to missions, and control when forces can access them.
- Missions exported from METIS will now be exported as ZIP files. These ZIP files will include any files linked to the mission from the file store. When the export is imported into METIS, any files in the export absent from the file store will be uploaded.
- The style and design of METIS have been revamped, simplifying the color palette used and smoothing out the overall look of the UI.
- Lists received a massive overhaul, including support for additional columns, quicker access to list and item options, support for item selection, support for disabled items, and more.
- Additional columns have been added to lists on the home page, providing extra details for the items in the lists, such as who created an item, when it was created, when it was last updated, and much more.
- Prototypes no longer require a corresponding node in every force. Now, a node can be marked as excluded from a force, which will leave a gap in the structure for that force.
- An option can now be toggled for a force making all nodes in that force immediately accessible to members of that force.
- The METIS internal target environment has been restructured to contain more specific target options for nodes and actions. Additionally, effects, such as success-chance or process-time modification, can now be configured to target either an entire node (like before) or a specific action.
- Triggers have been added for effects, which define when an effect is enacted. Now, an effect can also be triggered upon failed execution or upon execution initiation.
- Resource labels have been added, which allow resources to be renamed on a per-mission basis based on the currency needed for a scenario.
- Resource cost, success chance, and process time can now be obfuscated for an action in a mission. Any participant executing an action in a session cannot see the value of the obfuscated properties.
- The behavior of an action opening a node upon success is now optional. Actions can now be created which will never open the node.
- Support for opening nodes via the target-effect system has been added. Effects can now be created to open a specific node dynamically.
- Support for awarding resources to a force via the target-effect system has been added. Effects can now be created to positively increase a force's resource pool dynamically.
- Support for negative resource pools has been added. A mission designer can now enable negative resource pools for a mission, which will disable the default behavior preventing a force from going below 0.
- Missions can now be play-tested. This allows users to walkthrough missions without the typical process of configuring, launching, joining, and starting a session manually.
- Rich text editors used on the mission page have been revamped to be more intuitive and use a more powerful underlying engine. Code blocks are also now supported.
- Actions can now be duplicated within a node and effects can be duplicated within an action. The ability to duplicate actions from one node to another node, or an effect from one action to another action is currently not supported, but it will be in the future.
- User page now supports more advanced edits for users. Now an admin can update a user’s password to a new temporary or permanent password or change their access level.
- Mission-issue-detection system has been improved and now supports the detection of a larger scope of issues.
- New methods for deploying METIS have been created, including via Docker. Environment configuration for METIS installs can now be fine tuned and development, production, and testing configurations can be run from the same install in parallel.
- Support for effect migrations has been added, allowing developers of target-environments to write code to migrate effects from one version of a target-environment to another version.

# version-2.0.4 | 4-6-2025

- Fixed the issue with errors being thrown on the client when a session participant executes an action with effects that have a node or output target from the METIS target environment tied to it
- Fixed the issue with notifications not being removed from the global state after they expire or are dismissed

# version-2.0.3 | 2-25-2025

- Fixed all known issues centered around executing an action on a node during a session

# version-2.0.2 | 2-20-2025

- Created a temporary (manual) solution for managing multiple users at once
- Bug fixes and performance enhancements to provide a better user experience

# version-2.0.1 | 1-17-2025

- Implemented the ability to give sessions a custom name

# version-2.0.0 | 1-10-2025

- Created a new property within missions called prototype nodes which are used to define the hierarchy structure of all nodes found throughout the forces within a mission
- Implemented a new property within missions called forces which are used to create multiple different views/experiences of the node hierarchy structure and provide support for multiplayer collaboration during mission execution
- Created a new system for executing missions called sessions. Sessions use server-side logic via a new WebSocket system to execute missions and provide initial support for multiplayer collaboration with features like assigning members to a force and assigning roles to members
- Refactored the API (Application Programming Interface) for organizational and security purposes
- Replaced the asset system with the target-effect system so that METIS (Modular Effects-Based Transmitter for Integrated Simulations) can communicate with other software and affect custom targets stored in those target environments. This will also allow other software to communicate with and modify certain targets within METIS (e.g. nodes within a specific force)
- Implemented a new user management system so that authorized users can create additional users
- Created a new permission-based system for METIS users that properly authorizes different users to perform different operations within METIS (a separate, but similar permission system is used for the session system)
- Created a system to alert authorized users of conflicts found within a mission, prompting them to address the issues and resolve them before launching a session
- Implemented a new system for displaying messages in the output panel. The new system uses server-side logic via a new WebSocket system and is compatible with the new target-effect system
- Developed a brand-new, more efficient, modular, and maintainable engine for the mission map
- Added file-store compatibility. This allows a file store to be maintained on the METIS server with the files being accessible via the API. Currently, there is no write, so all files must manually be placed into the file store
- Refactored the form fields to be more versatile and powerful when being used throughout METIS
- Various refactors, improvements, design changes, and bug fixes

# version-1.3.8 | 1-3-2024

- Fixed issue where actions within a mission that had a resource cost of 0 would result in an infinite amount of attempts to execute causing the app to break once that mission was selected

# version-1.3.7 | 12-6-2023

- Raised the memory limit for the JSON parser on the server from 100kb to 10mb

# version-1.3.6 | 11-9-2023

- Fixed styling issue with text displayed in the terminal (output panel) on the game page
- A new mission-node's description and pre-execution text no longer have default text since the properties are optional and can be saved to the database as empty strings

# version-1.3.5 | 10-25-2023

- Updated branding throughout the whole web application to use the new emblem and logo created for METIS

# version-1.3.4 | 10-6-2023

- Created a rich text editor in the Mission Form Page (Edit Mission Page) so that hyperlinks can be used and text can be emboldened, underlined, or italicized
- Created HTML sanitization so that the HTML being saved to the database is sanitized to prevent cross-site scripting (XSS) and other malicious attacks
- Created logic for the output panel (terminal) in the Game Page to be able to read and display the rich text (i.e., hyperlinks) correctly
- Restructured the middleware functions that are used to validate data being sent to the database in the body, query, and params of a request via the API
- Various optimizations, bug fixes, and design changes to provide a better user experience

# version-1.3.3 | 7-25-2023

- Integrated with ASCOT

# version-1.3.2 | 7-7-2023

- Updated default missions that are generated when METIS is first set up

# version-1.3.1 | 7-3-2023

- Created a feature for missions to have an introduction message that displays in the terminal on the game page when a user selects a mission to go through
- Updated asset structure for cyber city to include effects for radar
- Updated the README.md for more detailed instructions on setting up an environment to use METIS
- Fixed bug with the color import feature
- Fixed bug where the traffic lights would not turn on/off by zone using the asset feature
- Minor design changes
- Various optimizations and other minor bug fixes and improvements

# version-1.3 | 6-14-2023

- Created new asset feature where the instructors will be able to affect assets (upon successful execution only) within cyber city via the PLC API
- Created a pagination design for the list of missions on the landing page
- Created a search filter feature for the mission selection page, or landing page, so that a user can quickly find a specific mission by typing in its name
- A list of assets can be saved to an individual mission
- Created middleware functions that ensure data passed to the API is properly vetted, and any invalid data is rejected before that data is used in the database
- Changed the validation function for the colors that are used for mission-nodes so that only hex color codes are stored in the database
- Every mission-node’s background matches the background color of the Mission Map, and the border color can be changed by the instructor
- Changed the logos and titles throughout the application from CESAR (Cyber Effects Simulator and Relay) to METIS (Modular Effects-Based Transmitter for Integrated Simulations)
- Changed how the import/export file extension worked so that missions that are exported will have a ".metis" extension instead of a ".cesar" file extension and the import feature will only except files with a ".metis" extension moving forward
- Changed the user interface for the border color selector in the edit mission page from text to color squares
- Removed arrowheads and junction points that were displayed from a parent node to its child node(s)
- Created a migration script to convert/update color properties from text strings to hex color codes
- Created VS Code Debugger so that developers can find and fix bugs within the web application more efficiently and effectively
- Created unit tests for every mission route on the API
- Created unit tests for the middleware functions to make sure that the middleware functions properly validate the type of each piece of data being sent, that the correct data is being sent, and that there is not a single piece of data missing within the request sent to the API
- Created additional tests for the import/export feature to make sure that only ".metis" files can be imported if the "schema build number" stored in the file equals 10 or more and ".cesar" files if the "schema build number" is 9 or less
- Created tests for the color validation function to make sure that only hex color codes can be stored in the database and anything else returns an internal server error (500) response
- Created a logging system for the asset feature when the PLC API is called
- Created a logging system for the tests when they are being run
- Minor design changes
- Various optimizations and other minor bug fixes and improvements

# version-1.2.3 | 4-17-2023

- If a user is logged in and copies a mission from the game page, then a prompt will appear after it copies and give the user the option to stay in the current mission they just copied or go to the copied mission
- An action becomes greyed out and the user cannot select it in the node-action-window if the action costs more resources than the user has left to spend
- New design of all "close" or "exit" or "x" buttons throughout the entire application

# version-1.2.2 | 3-16-2023

- Fixed an issue where the nodes in the node structure panel found in the edit mission page were not collapsing and expanding

# version-1.2.1 | 3-10-2023

- Fix for corrupted data

# version-1.2 | 3-7-2023

- Missions can now be imported and exported as files
- Created a new testing environment to ensure application stability
- Database will now automatically backup upon server start-up and every 24 hours thereafter
- Missions are now scrupulously validated before saved to the database
- Added resize bars to the game and mission form page. These resize bars can be used to resize the relationship between two panels being displayed in the viewport
- Updated system to allow for multiple nodes to be executed at once
- A version watermark was added to the bottom of the mission selection page. Clicking the watermark will allow the user to view the changelog for the project
- Design changes made to the map prompts shown during gameplay
- A new type of notification was introduced, called a prompt, which will more forcefully notify a user of given information, with a button below to dismiss it
- Added a detailed output message that will display in the console once an action begins executing
- Added a description property to mission nodes, which will be displayed upon hover-over
- When selecting an action to execute on a node, options that require more resources than that available to the student are now greyed out
- Timestamps are now shown for console outputs during gameplay
- Regular notifications will now sometimes have buttons below the message to perform relevant actions
- Hovering over a node while an action is being executed on it will display the time remaining before that action is completed
- Prompts displayed in the map during gameplay will now be perfectly centered within the map
- Fixed text overflow issue in the console output panel on the game page. Text will now not overflow off the panel
- Raised and restyled the mission title for the mission map to reduce interference with the content being displayed
- Greatly reorganized the project to help project scalability
- Fixed an issue, where, if an API request was made to update a mission, and within the nodeData, there was an omitted property, the original value of that property would be deleted
- Fixed issue where the selection box for a mission on the mission selection page did not take up the full width available to it
- Various optimizations and other minor bug fixes and improvements

# version-1.1.2 | 1-24-2023

- Fixed issue where multiple nodes could be executed at the same time
- Fixed issue where a node can be executed while the same node is executing

# version-1.1.1 | 1-9-2023

- Deleted missions can now be recovered by developers
- Fixed issue with missions not loading correctly
- Fixed issue with loading bar not working properly

# version-1.1 | 12-30-2022

- Changed node creation on the mission form to allow users to pinpoint exactly where they would like to create their node
- When deleting a node, the instructor will now have the option to either delete it and all its children, as before, or, delete and shift the child nodes over to the left
- Added the depth padding property to nodes, which allows an instructor to offset the positioning of nodes along the x-axis
- A student can now execute an action as many times as they would like for the resources they have available
- A button to delete a node is now available from the mapped node directly
- All missions now must have at least one node
- All nodes now must have at least one action
- An instructor can no longer leave fields blank in the mission edit page
- Post-execution success and failure text, as well as resource cost, is now linked to an action for a node instead of the node itself
- General visual improvements to the mission edit page
- Re-enabled collapse and expand in the node structure panel on the mission edit page
- When viewing actions on the mission edit page, the actions for a given node are now paginated to reduce unnecessary scrolling
- Created an automated database migration system to transition between schema changes
- Updated database schema to include restrictions on how action and node data can be stored
- Database is now password-secure
- Add logging system to log server output to files instead of the console
- Optimization and fixes for various bugs and visual issues

# version-1.0.3 | 12-9-2022

- Fixed issue with actions not saving properly

# version-1.0.2 | 11-30-2022

- Nodes are now left aligned on the map to limit the panning required by the user
- Newly revealed nodes on the map will now automatically pan into view
- Navigating away from the mission form page will now prompt for unsaved changes in all cases
- Fixed issue with output panel sizing
- Set default port for the web server to 8080
- Added front-end logic for handling corrupted data

# version-1.0.1 | 11-23-2022

- Bug with mission form not saving execution texts correctly

# version-1.0 | 11-22-2022

Official full-release.
