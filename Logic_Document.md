## Smart Assign Logic
I used aggregation to count active tasks for each user. The task is assigned to the user with the fewest "Todo/In Progress" tasks.

## Conflict Handling Logic
If two users edit the same task within 5 seconds, the server detects it using "lastEditedAt" timestamp. It returns a conflict message and lets frontend handle merging or overwrite.
