import * as d3 from "https://unpkg.com/d3?module";

const url =
  "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/GDP-data.json";

fetch(url)
  .then((res) => {
    if (!res.ok) {
      throw new Error(response.statusText);
    }
    return res.json();
  })
  .then((data) => {})
  .catch((error) =>
    console.log("Not able to fetch the data. There was an error: ", error)
  );
