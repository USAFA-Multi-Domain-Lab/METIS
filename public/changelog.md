# changelog

# version-1.3.9 | 4-25-2024

- Fixed issue where users cannot execute an action that cost 0 resources if they have 0 resources remaining within a mission

# version-1.3.8 | 1-3-2024

- Fixed issue where actions within a mission that had a resource cost of 0 would result in an infinite amount of attempts to execute causing the app to break once that mission was selected

# version-1.3.7 | 12-6-2023

- Raised the memory limit for the JSON parser on the server from 100kb to 10mb

# version-1.3.6 | 11-9-2023

- Fixed styling issue with text displayed in the terminal (output panel) on the game page
- New mission-node's descriptions and pre-execution text no longer have default text since the property is optional and can be saved to the database as an empty string

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
