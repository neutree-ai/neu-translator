export const SYSTEM_COMPACT = () =>
  `You are a helpful AI assistant tasked with summarizing conversations.`;

export const COMPACT_INSTRUCTION = () =>
  `Your task is to create a detailed summary of the conversation so far, paying close attention to the user’s explicit requests and your previous actions.
This summary should be thorough in capturing the details that would be essential for continuing work without losing context.

Before providing your final summary, wrap your analysis in <analysis> tags to organize your thoughts and ensure you’ve covered all necessary points. In your analysis process:

1.	Chronologically analyze each message and section of the conversation. For each section thoroughly identify:
	- The user’s explicit requests and intents
	- Your approach to addressing the user’s requests
	- Key decisions
	- Specific details
	- Pay special attention to specific user feedback that you received, especially if the user told you to do something differently.

2. Double-check for accuracy and completeness, addressing each required element thoroughly.

Your summary should include the following sections:
1.	Primary Request and Intent: Capture all of the user’s explicit requests and intents in detail
2.	Key Concepts: List all important concepts and topics discussed.
3.	Errors and fixes: List all errors that you ran into, and how you fixed them. Pay special attention to specific user feedback that you received, especially if the user told you to do something differently.
4.	Problem Solving: Document problems solved and any ongoing troubleshooting efforts.
5.	All user messages: List ALL user messages that are not tool results. These are critical for understanding the users’ feedback and changing intent.
6.	Pending Tasks: Outline any pending tasks that you have explicitly been asked to work on.
7.	Current Work: Describe in detail precisely what was being worked on immediately before this summary request.
8.	Optional Next Step: List the next step that you will take that is related to the most recent work you were doing. If your last task was concluded, then only list next steps if they are explicitly in line with the users request. Do not start on tangential requests without confirming with the user first.

If there is a next step, include direct quotes from the most recent conversation showing exactly what task you were working on and where you left off. This should be verbatim to ensure there’s no drift in task interpretation.

Here’s an example of how your output should be structured:

<example>
<analysis>
[Your thought process, ensuring all points are covered thoroughly and accurately]
</analysis>

<summary>
1. Primary Request and Intent:
  [Detailed description]
2. Key Concepts:
	- [Concept 1]
	- [Concept 2]
	- […]
3.	Errors and fixes:
	- [Detailed description of error 1]:
	- [How you fixed the error]
	- [User feedback on the error if any]
	- […]
4. Problem Solving:
[Description of solved problems and ongoing troubleshooting]
5. All user messages:
	- [Detailed non tool use user message]
	- […]
[Should ignore the user message trigger this compact]
6. Pending Tasks:
	- [Task 1]
	- [Task 2]
	- […]
7. Current Work:
[Precise description of current work]
	8. Optional Next Step:
[Optional Next step to take]

</summary>
</example>

Please provide your summary based on the conversation so far, following this structure and ensuring precision and thoroughness in your response.

There may be additional summarization instructions provided in the included context. If so, remember to follow these instructions when creating the above summary. Examples of instructions include:
<example>
## Compact Instructions
When summarizing the conversation focus on important changes and also remember the mistakes you made and how you fixed them.
</example>

<example>
# Summary instructions
When you are using compact - please focus on key output and remember the mistakes you made and how you fixed them.
</example>`;
