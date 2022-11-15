const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19IndiaPortal.db");
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
//authenticate token
const authenticateToken = (request, response, next) => {
    let jwtToken;
    const authHeader = request.headers["authorization"];
    if (authHeader !== undefined) {
        jwtToken = authHeader.split(" ")[1];
    }
    if (jwtToken === undefined) {
        response.status(401);
        response.send("Invalid JWT Token");
    } else {
        jwt.verify(jwtToken, "qwertyuiop", async (error, payload) => {
            if (error) {
                response.status(401);
                response.send("Invalid JWT Token");
            } else {
                next();
            };
        });
    };
};


//login
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "qwertyuiop");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});


//Get  all states Details
app.get("/states/", authenticateToken, async (request, response) => {
    const getStates = `
    SELECT *
    FROM state
    ORDER BY state_id;`;
    const dbObject = await db.all(getStates);
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

app.get("/states/:stateId/", authenticateToken, async (request, response) => {
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

//create new district
app.post("/districts/", authenticateToken, async (request, response) => {
    const { districtName, stateId, cases, cured, active, deaths } = request.body;
    const addDistrict = `
    INSERT INTO 
        district (district_name, state_id, cases, cured, active, deaths)
    VALUES(
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths});`;
    await.run(addDistrict);
    response.send("District Successfully Added");
});


//get district details using Id

app.get("/districts/:districtId/", authenticateToken, async (request, response) => {
    const { districtId } = request.params;
    const getDistrict = `
    SELECT *
    FROM district
    WHERE district_id=${districtId};`;

    const dbObject = await db.get(getDistrict);
    const conversion = (dbObject) => {
        return {
            districtId: district_id,
            districtName: district_name,
            stateId: state_id,
            cases: cases,
            cured: cured,
            active: active,
            deaths: deaths,
        };
    };
    const finalOutput = conversion(dbObject);
    response.send(finalOutput);
});


//delete district using districtId
app.delete("/districts/:districtId/", authenticateToken, async (request, response) => {
    const { districtId } = request.params;
    const deleteDistrict = `
    DELETE FROM district
    WHERE district_id=${districtId};`;
    await db.run(deleteDistrict);
    response.send("District Removed");
});

//update district details
app.put("/districts/:districtId/", authenticateToken, async (request, response) => {
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
app.get("/states/:stateId/stats/", authenticateToken, async (request, response) => {
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




module.exports = app;
