// Fun encouraging messages — English for max humor

export interface MessageTemplate {
  category: string;
  messages: string[];
}

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    category: "ace",
    messages: [
      "HOLE IN ONE! {player} just became a LEGEND! 🏆🎉🎆",
      "STOP EVERYTHING. {player} JUST ACED HOLE {hole}!!! Call the newspapers!",
      "The golf gods have spoken and they said: {player}! ACE! 🕳️⚡",
    ],
  },
  {
    category: "albatross",
    messages: [
      "🦅🦅🦅 WHAT JUST HAPPENED?! {player} made an ALBATROSS! That's going straight to the group chat!",
      "Alert the media! {player} just pulled off an albatross on hole {hole}!",
      "Is this the PGA Tour? Because {player} just made an ALBATROSS!",
    ],
  },
  {
    category: "eagle",
    messages: [
      "🦅 {player} is BUILT DIFFERENT! Eagle on hole {hole}!",
      "Someone check if that's legal! {player} with the EAGLE!",
      "The eagle has landed! {player} goes {score} on hole {hole}!",
      "🦅 {player} just entered the chat. Eagle.",
      "{player} saw par and said 'I'll take two less, please.' EAGLE!",
    ],
  },
  {
    category: "birdie",
    messages: [
      "🐦 Birdie alert! {player} is cooking!",
      "Professional golfer detected! {player} with the birdie!",
      "🐦 That's what we call 'playing golf'! {player} birdies hole {hole}!",
      "{player} making it look easy. Birdie! 🐦",
      "The birdie train has arrived. All aboard! 🐦 {player}!",
      "Under par? In THIS economy? {player} with the birdie!",
    ],
  },
  {
    category: "par",
    messages: [
      "Solid par, {player}. The backbone of champions. ⛳",
      "Par is NOT boring — par is RELIABLE. Well played, {player}.",
      "Steady as she goes, captain {player}. ⛳",
      "Tiger made a career of pars. Just saying. Nice one, {player}.",
      "{player} pars it. Clean. Professional. Chef's kiss. 👨‍🍳",
    ],
  },
  {
    category: "bogey",
    messages: [
      "One over? That's called 'course management', baby. Keep going, {player}!",
      "{player} is just building character on hole {hole}.",
      "Even Tiger has bogey days. You're in good company, {player}.",
      "Bogey? More like a par that got lost on the way. Keep at it, {player}!",
      "Every bogey is just a future birdie warming up. Let's go, {player}!",
    ],
  },
  {
    category: "double_bogey",
    messages: [
      "It's not about the score, it's about the friends we made along the way. Right, {player}?",
      "The course is playing tough today, right {player}? 😅",
      "Double bogey = two chances to be great on the next hole. {player} approves.",
      "{player}, that hole owes you a beer. Moving on!",
      "We're going to pretend that didn't happen. Next hole, {player}! 🫡",
    ],
  },
  {
    category: "triple_plus",
    messages: [
      "🔥 {player} found every bunker, tree, and pond on hole {hole}. LEGEND.",
      "That hole will make a great story at the 19th hole! Right, {player}?",
      "Some holes just want to watch the world burn. Next hole, {player}! 🔥",
      "Golf is 90% mental. The other 10% is... also mental. Keep going {player}! 🧠",
      "Remember: Happy Gilmore started like this too! {player} comeback loading... ⏳",
      "{player} just donated some strokes to charity. Very generous. 😂",
      "That's what we call a 'character-building hole'. {player} has SO much character now.",
    ],
  },
  {
    category: "par_streak",
    messages: [
      "{player} is a PAR MACHINE! {streak_count} in a row! 🤖",
      "Mr./Ms. Consistent! {player} with {streak_count} pars straight! ⛳⛳⛳",
      "{player} found a groove and they're NOT letting go. {streak_count} pars!",
    ],
  },
  {
    category: "birdie_streak",
    messages: [
      "🔥🐦 {player} is ON FIRE! {streak_count} birdies in a row!",
      "BIRDIE STREAK! {player} cannot be stopped! {streak_count} and counting!",
      "Is {player} even human?! {streak_count} consecutive birdies!",
    ],
  },
  {
    category: "bogey_streak",
    messages: [
      "Plot twist loading for {player}... the comeback arc starts HERE!",
      "{player}, the next birdie is going to taste SO sweet after this.",
      "Remember: every hero needs a villain arc first. {player} is setting up something EPIC.",
    ],
  },
  {
    category: "bounce_back",
    messages: [
      "FROM THE ASHES! 🔥 {player} bounces back with style!",
      "NOW THAT'S what we're talking about! {player} with the COMEBACK!",
      "You thought {player} was done? NOPE. Bounce back baby! 💪",
    ],
  },
  {
    category: "first_birdie",
    messages: [
      "{player} breaks the seal! First birdie of the day! 🎉🐦",
      "The drought is OVER! {player} finally bags a birdie!",
      "{player} just remembered how to play golf! First birdie! 🐦",
    ],
  },
];

export function getRandomMessage(
  category: string,
  vars: Record<string, string | number>
): string | null {
  const template = MESSAGE_TEMPLATES.find((t) => t.category === category);
  if (!template) return null;

  const msg =
    template.messages[Math.floor(Math.random() * template.messages.length)];

  return Object.entries(vars).reduce(
    (text, [key, value]) => text.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
    msg
  );
}
