# changelog

# version-1.2 | 3-7-2024

- Missions can now be imported and exported as files
- Created a new testing environment to ensure application stability
- Database will now automatically backup upon server start-up and every 24 hours thereafter
- Missions are now scrupulously validated before saved to the database
- Added resize bars to the game and mission form page. These resize bars can be used to resize the relationship between two panels being displayed in the viewport
- Updated system to allow for multiple nodes to be executed at once
- A version watermark was added to the bottom of the mission selection page. Clicking the watermark will allow the user to view the changelog for the project
- Design changes made to the map prompts shown during gameplay
- A new type of notification was introduced, called a prompt, which will more forcifully notify a user of given information, with a button below to dismiss it
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
- Fixed an issue, where, if an API request was made to update a mission, and within the nodeData, there was an ommitted property, the original value of that property would be deleted
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
- Reenabled collapse and expand in the node structure panel on the mission edit page
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
