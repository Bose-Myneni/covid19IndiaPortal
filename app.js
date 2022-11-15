const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//Get state Details
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT *
    FROM state;`;
  const dbObject = await db.all(getStatesQuery);
  const finalOutput = dbObject.map((details) => {
    return {
      stateId: details.state_id,
      stateName: details.state_name,
      population: details.population,
    };
  });
  response.send(finalOutput);
});

//get states using stateId

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQueryId = `
    SELECT *
    FROM state
    WHERE state_id= ${stateId};`;
  const dbObject = await db.all(getStateQueryId);
  const finalOutput = dbObject.map((details) => {
    return {
      stateId: details.state_id,
      stateName: details.state_name,
      population: details.population,
    };
  });
  response.send(finalOutput);
});

//post district
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
    INSERT INTO 
    district(district_name, state_id, cases, cured, active, deaths)
    VALUES
    ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
}); //get district details using Id

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT *
    FROM district
    WHERE district_id= ${districtId};`;
  const dbObject = await db.all(getDistrictQuery);
  const finalOutput = dbObject.map((details) => {
    return {
      districtId: details.district_id,
      districtName: details.district_name,
      stateId: details.state_id,
      cases: details.cases,
      cured: details.cured,
      active: details.active,
      deaths: details.deaths,
    };
  });
  response.send(finalOutput);
});

//delete district using districtId
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM district
    WHERE district_id= ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//update district details
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
    UPDATE district
    SET 
        district_name='${districtName}',
        state_id=${stateId},
        cases=${cases},
        cured=${cured},
        active=${active},
        deaths=${deaths}
    WHERE district_id=${districtId};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//getting stats using stateId
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `
    SELECT SUM(cases) AS totalCases, SUM(cured) AS totalCured, SUM(active) AS totalActive, SUM(deaths) AS totalDeaths
    FROM district 
    WHERE state_id=${stateId};`;
  const dbObject = await db.all(getStatsQuery);
  const finalOutput = dbObject.map((details) => {
    return {
      totalCases: details.totalCases,
      totalCured: details.totalCured,
      totalActive: details.totalActive,
      totalDeaths: details.totalDeaths,
    };
  });
  response.send(finalOutput);
});

//get state name from district Id
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT state_name as stateName
    FROM state INNER JOIN district ON state.state_id=district.state_id
    WHERE district_id=${districtId};`;
  const dbObject = await db.get(getStateNameQuery);
  response.send(dbObject);
});

module.exports = app;
