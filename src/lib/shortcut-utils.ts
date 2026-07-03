/**
 * Generate Android Tasker profile XML
 * This creates a profile that opens the weekly check-in URL
 */
export function generateTaskerProfile(weeklyCheckinUrl: string, dayOfWeek: number = 1, hour: number = 9): string {
  // dayOfWeek: 1 = Monday, 7 = Sunday
  // hour: 0-23
  const timestamp = Date.now();
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<TaskerData sr="" dvi="1" tv="6.0.0">
  <Profile sr="prof0" ve="2">
    <cdate>${timestamp}</cdate>
    <clp>true</clp>
    <edate>0</edate>
    <id>0</id>
    <mid0>0</mid0>
    <nme>Weekly Check-In</nme>
    <Event sr="con0" ve="2">
      <code>123</code>
      <Int sr="arg0" val="${dayOfWeek}"/>
      <Int sr="arg1" val="${hour}"/>
      <Int sr="arg2" val="0"/>
    </Event>
  </Profile>
  <Task sr="task0">
    <cdate>${timestamp}</cdate>
    <edate>0</edate>
    <id>0</id>
    <nme>Open Weekly Check-In</nme>
    <Action sr="act0" ve="7">
      <code>5</code>
      <Str sr="arg0" ve="3">${weeklyCheckinUrl}</Str>
      <Int sr="arg1" val="0"/>
    </Action>
  </Task>
</TaskerData>`;
}

/**
 * Generate a simple automation script for Android (Google Assistant Routines compatible)
 * This is a text file with instructions that can be used with various automation apps
 */
export function generateAndroidAutomationScript(weeklyCheckinUrl: string): string {
  return `# Weekly Check-In Automation Script
# Compatible with: Google Assistant Routines, Tasker, Automate, etc.

# Trigger: Weekly (Monday 9:00 AM)
# Action: Open URL

URL: ${weeklyCheckinUrl}

# Instructions:
# 1. Open your automation app (Google Assistant Routines, Tasker, etc.)
# 2. Create a new routine/automation
# 3. Set trigger to "Time of Day" → Weekly → Monday 9:00 AM
# 4. Add action: "Open URL" or "Open Link"
# 5. Paste the URL above
# 6. Save and enable the automation`;
}

/**
 * Download a file
 */
export function downloadFile(content: string | Blob, filename: string, mimeType: string): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

