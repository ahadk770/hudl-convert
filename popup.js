let videoId = "";
let teamId = "";
let host = "";

const buildPerformanceCoreUrl = (host, videoId, teamId) =>
  `https://${host}/watch/team/${teamId}/analyze?v=${videoId}`;

const REGEX_TO_PARSE_VIDEO_ID = /\/watch\/video\/([^\/]+)\//;
const REGEX_ONLY_DIGIT = /\D/g;
const VPSA_PATH_KEYWORD = "/watch/video/";
const LOCALHOST_KEYWORD = "localhost";
const LOCALHOST_HOST_NAME = "localhost.app.thorhudl.com";

const Elements = {
  SubmitButton: "submit",
  TeamIdInput: "teamIdInput",
  CreateTeamNameInput: "createTeamNameInput",
  CreateTeamIdInput: "createTeamIdInput",
  CreateTeamButton: "createTeamButton",
  SavedTeamsContainer: "savedTeamsContainer",
  SavedTeamsTitle: "savedTeamsTitle",
  SavedTeamsTitleBar: "savedTeamsTitleBar",
};

const EventListener = {
  DOMContentLoaded: "DOMContentLoaded",
  Input: "input",
  Click: "click",
};

const CreateElement = {
  Button: "button",
  Div: "div",
};

const CSSClassname = {
  TeamContainer: "teamContainer",
  TeamInfoButton: "teamInfoButton",
  DeleteButton: "deleteButton",
};

const X = "X";

const parseUrl = (url) => {
  const urlObj = new URL(url);

  if (urlObj.host.includes(LOCALHOST_KEYWORD)) {
    host = LOCALHOST_HOST_NAME + ":" + urlObj.port;
  } else {
    host = urlObj.host;
  }

  const { pathname } = urlObj;

  console.log(urlObj);

  if (pathname.includes(VPSA_PATH_KEYWORD)) {
    const idMatch = pathname.match(REGEX_TO_PARSE_VIDEO_ID);
    if (idMatch && idMatch[1]) {
      videoId = idMatch[1];
    }
  }
};

(async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });

  parseUrl(tab.url);
  if (host && videoId && teamId) {
    const button = document.getElementById(Elements.SubmitButton);
    if (button) {
      button.disabled = false;
    }
  }
})();

const renderSavedTeamsContainer = () => {
  const savedTeamsContainer = document.getElementById(
    Elements.SavedTeamsContainer
  );
  savedTeamsContainer.innerHTML = "";

  chrome.storage.sync.get({ teams: [] }, function (result) {
    const teams = result.teams?.reverse();
    if (teams.length > 0) {
      const savedTeamsTitle = document.getElementById(Elements.SavedTeamsTitle);
      if (savedTeamsTitle) savedTeamsTitle.hidden = false;
      const savedTeamsTitleBar = document.getElementById(
        Elements.SavedTeamsTitleBar
      );
      if (savedTeamsTitleBar) savedTeamsTitleBar.hidden = false;
    }
    teams.forEach((team) => {
      const teamElement = createTeamElement(team.teamName, team.teamId);
      if (teamElement) savedTeamsContainer.appendChild(teamElement);
    });
  });
};

document.addEventListener(EventListener.DOMContentLoaded, () => {
  renderSavedTeamsContainer();
  addEventListenerToCreateTeamInput();
  addEventListenerToTeamIdInput();
  addEventListenerToSubmitButton();
});

const addEventListenerToTeamIdInput = () => {
  const teamIdInput = document.getElementById(Elements.TeamIdInput);
  const submitButton = document.getElementById(Elements.SubmitButton);
  if (teamIdInput) {
    teamIdInput.addEventListener(EventListener.Input, () => {
      teamIdInput.value = teamIdInput.value.replace(REGEX_ONLY_DIGIT, "");
      teamId = teamIdInput.value;
      if (submitButton && videoId)
        submitButton.disabled = !teamIdInput.value.trim();
    });
  }
};

const addEventListenerToSubmitButton = () => {
  const submitButton = document.getElementById(Elements.SubmitButton);
  if (submitButton) {
    submitButton.addEventListener(EventListener.Click, () => {
      chrome.tabs.create({
        url: buildPerformanceCoreUrl(host, videoId, teamId),
      });
    });
  }
};

const addEventListenerToCreateTeamInput = () => {
  const createTeamButtonInput = document.getElementById(
    Elements.CreateTeamButton
  );
  const createTeamIdInput = document.getElementById(Elements.CreateTeamIdInput);
  const createTeamNameInput = document.getElementById(
    Elements.CreateTeamNameInput
  );

  createTeamButtonInput.addEventListener(EventListener.Click, () => {
    const newTeamId = createTeamIdInput.value;
    const newTeamName = createTeamNameInput.value;
    createTeamAndAddToLocalStorage(newTeamId, newTeamName);
  });
};

const createTeamAndAddToLocalStorage = (newTeamId, newTeamName) => {
  if (newTeamId && newTeamName) {
    chrome.storage.sync.get({ teams: [] }, function (result) {
      const { teams } = result;
      if (teams && !teams.some((team) => team.teamId === newTeamId)) {
        teams.push({ teamName: newTeamName, teamId: newTeamId });
        chrome.storage.sync.set({ teams: teams }, function () {
          renderSavedTeamsContainer();
        });
      }
    });
  }
};

const createTeamElement = (teamName, newTeamId) => {
  const team = document.createElement(CreateElement.Div);
  team.className = CSSClassname.TeamContainer;
  team.appendChild(createTeamInfo(teamName, newTeamId));
  team.appendChild(createDeleteButton(newTeamId));
  return team;
};

const createTeamInfo = (teamName, newTeamId) => {
  const teamInfo = document.createElement(CreateElement.Button);
  teamInfo.className = CSSClassname.TeamInfoButton;
  teamInfo.innerHTML = `<p class=savedTeamTitle>${teamName}</p> <p>${newTeamId}</p>`;
  teamInfo.addEventListener(EventListener.Click, () => {
    teamId = newTeamId;
    const teamIdInput = document.getElementById(Elements.TeamIdInput);
    teamIdInput.value = newTeamId;
    const submitButton = document.getElementById(Elements.SubmitButton);
    if (videoId) submitButton.disabled = false;
  });
  return teamInfo;
};

const createDeleteButton = (newTeamId) => {
  const deleteButton = document.createElement(CreateElement.Button);
  deleteButton.textContent = X;
  deleteButton.className = CSSClassname.DeleteButton;
  deleteButton.addEventListener(EventListener.Click, () => {
    chrome.storage.sync.get({ teams: [] }, function (result) {
      const teams = result.teams.filter((team) => team.teamId !== newTeamId);
      if (teams.length === 0) {
        const savedTeamsTitle = document.getElementById(
          Elements.SavedTeamsTitle
        );
        if (savedTeamsTitle) savedTeamsTitle.hidden = true;

        const savedTeamsTitleBar = document.getElementById(
          Elements.SavedTeamsTitleBar
        );
        if (savedTeamsTitleBar) savedTeamsTitleBar.hidden = true;
      }
      chrome.storage.sync.set({ teams: teams }, function () {
        renderSavedTeamsContainer();
      });
    });
  });
  return deleteButton;
};
