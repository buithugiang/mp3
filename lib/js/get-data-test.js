//adapted from the cerner smart on fhir guide. updated to utalize client.js v2 library and FHIR R4

//create a fhir client based on the sandbox enviroment and test paitnet.
const client = new FHIR.client({
  serverUrl: "https://r4.smarthealthit.org",
  tokenResponse: {
    patient: "689892bd-dcbe-41fc-8651-38a1d0893854"
  }
});

// helper function to process fhir resource to get the patient name.
function getPatientName(pt) {
  if (pt.name) {
    var names = pt.name.map(function(name) {
      return name.given.join(" ") + " " + name.family;
    });
    return names.join(" / ")
  } else {
    return "anonymous";
  }
}

// display the patient name gender and dob in the index page
function displayPatient(pt) {
  document.getElementById('patient_name').innerHTML = getPatientName(pt);
  document.getElementById('gender').innerHTML = pt.gender;
  document.getElementById('dob').innerHTML = pt.birthDate;
  document.getElementById('age').innerHTML = getage(pt.birthDate);
}

//function to display list of medications
function displayMedication(meds) {
  med_list.innerHTML += "<li> " + meds + "</li>";
}

//function to display list of medications
function displayConditions(conds) {
  cond_list.innerHTML += "<li> " + conds + "</li>";
}

//helper function to get quanity and unit from an observation resoruce.
function getQuantityValueAndUnit(ob) {
  if (typeof ob != 'undefined' &&
    typeof ob.valueQuantity != 'undefined' &&
    typeof ob.valueQuantity.value != 'undefined' &&
    typeof ob.valueQuantity.unit != 'undefined') {

    return Number(parseFloat((ob.valueQuantity.value)).toFixed(2)) + ' ' + ob.valueQuantity.unit;
  } else {
    return undefined;
  }
}

// helper function to get both systolic and diastolic bp
function getBloodPressureValue(BPObservations, typeOfPressure) {
  var formattedBPObservations = [];
  BPObservations.forEach(function(observation) {
    var BP = observation.component.find(function(component) {
      return component.code.coding.find(function(coding) {
        return coding.code == typeOfPressure;
      });
    });
    if (BP) {
      observation.valueQuantity = BP.valueQuantity;
      formattedBPObservations.push(observation);
    }
  });

  return getQuantityValueAndUnit(formattedBPObservations[0]);
}

// create a patient object to initalize the patient
function defaultPatient() {
  return {
    height: {
      value: ''
    },
    weight: {
      value: ''
    },
    sys: {
      value: ''
    },
    dia: {
      value: ''
    },
    ldl: {
      value: ''
    },
    hdl: {
      value: ''
    },
    hscrp: {
      value: ''
    },
    chol: {
      value: ''
    },
    note: 'No Annotation',
  };
}

//helper function to display the annotation on the index page
function displayAnnotation(annotation) {
  note.innerHTML = annotation;
}

//function to display the observation values you will need to update this
function displayObservation(obs) {

  hdl.innerHTML = obs.hdl;
  ldl.innerHTML = obs.ldl;
  sys.innerHTML = obs.sys;
  dia.innerHTML = obs.dia;
  weight.innerHTML = obs.weight;
  height.innerHTML = obs.height;
  chol.innerHTML = obs.chol;

  console.log(bloodPressure(parseFloat(obs.sys), parseFloat(obs.dia)));
  blood.innerHTML = bloodPressure(parseFloat(obs.sys), parseFloat(obs.dia));
  console.log(getbmi(parseFloat(obs.weight), parseFloat(obs.height)));
  bmi_text.innerHTML = getbmi(parseFloat(obs.weight), parseFloat(obs.height));
  chol_risk.innerHTML = getchol(parseFloat(obs.chol))

  var chol_r = Math.round(parseFloat(obs.chol)/parseFloat(obs.hdl));
  chol_ratio.innerHTML = chol_r;
  if (chol_r < 5) {
    heart_risk.innerHTML =  "Average risk for heart disease";
  }
  else {
    heart_risk.innerHTML =  "High risk for heart disease";
  }
}
var we;

// get patient object and then display its demographics info in the banner
client.request(`Patient/${client.patient.id}`).then(
  function(patient) {
    displayPatient(patient);
  }
);

// get observation resoruce values
// you will need to update the below to retrive the weight and height values
var query = new URLSearchParams();

query.set("patient", client.patient.id);
query.set("_count", 100);
query.set("_sort", "-date");
query.set("code", [
  'http://loinc.org|8302-2',
  'http://loinc.org|29463-7',
  'http://loinc.org|8462-4',
  'http://loinc.org|8480-6',
  'http://loinc.org|2085-9',
  'http://loinc.org|2089-1',
  'http://loinc.org|55284-4',
  'http://loinc.org|3141-9',
  'http://loinc.org|74774-1',
  'http://loinc.org|14647-2', // cholesterol
  'http://loinc.org|2093-3',  // cholesterol
  'http://loinc.org|2085-9',  // hdl
  'http://loinc.org|8480-6'   // systolic
].join(","));

client.request("Observation?" + query, {
  pageLimit: 0,
  flat: true
}).then(
  function(ob) {

    // group all of the observation resoruces by type into their own
    var byCodes = client.byCodes(ob, 'code');
    var systolicbp = getBloodPressureValue(byCodes('55284-4'), '8480-6');
    var diastolicbp = getBloodPressureValue(byCodes('55284-4'), '8462-4');
    var height = byCodes('8302-2');
    var weight = byCodes('29463-7');
    var hdl = byCodes('2085-9');
    var ldl = byCodes('2089-1');
    var hscrp = byCodes("74774-1");
    var chol = byCodes("14647-2", "2093-3");

    // create patient object
    var p = defaultPatient();

    // set patient value parameters to the data pulled from the observation resoruce
    if (typeof systolicbp != 'undefined') {
      p.sys = systolicbp;
    } else {
      p.sys = 'undefined'
    }

    if (typeof diastolicbp != 'undefined') {
      p.dia = diastolicbp;
    } else {
      p.dia = 'undefined'
    }

    p.hdl = getQuantityValueAndUnit(hdl[0]);
    p.ldl = getQuantityValueAndUnit(ldl[0]);
    p.height = getQuantityValueAndUnit(height[0]);
    p.weight = getQuantityValueAndUnit(weight[0]);
    p.hscrp = getQuantityValueAndUnit(hscrp[0]);
    p.chol = getQuantityValueAndUnit(chol[0]);
    we = weight[0];

    displayObservation(p)

  });



  var queryCond = new URLSearchParams();

  queryCond.set("patient", client.patient.id);
  queryCond.set("_count", 100);

  client.request("Condition?" + queryCond, {
      pageLimit: 0,
      flat: true
  }).then(
      function(data) {
          data.forEach(function(m) {
            displayConditions(m.code.text);
          })

      });





client.request('MedicationRequest?patient=' + client.patient.id, {resolveReferences: "medicationReference"}).then(
  function(data) {
      data.entry.forEach(function(m) {
        displayMedication(m.resource.medicationCodeableConcept.text);
      })
    }

);

function bloodPressure(systolic, diastolic) {

            if (systolic >= 180 || diastolic >= 120) {
                 return "High Blood Pressure Crisis";
             }
             if (systolic >= 140 || diastolic >= 90) {
                 return "High Blood Pressure Stage 2";
             }
             if ((systolic >= 130 && systolic <=  139) || (diastolic >= 80 && diastolic <= 89)) {
                 return "High Blood Pressure Stage 1";
             }
             if (systolic >= 120 && systolic <=  129 && diastolic < 80) {
                 return "Blood Pressure Elevated";
             }
             if (systolic < 120 && diastolic < 80) {
                 return "Blood Pressure Normal";
             }
             return "Blood Pressure Not Clear";
}


function getbmi(weight, height){


   height = height/100;

   bmi = weight/(height**2);
   console.log(bmi);
   if (bmi <= 18.5){
     return "Underweight";
   }
   if (bmi > 18.5 && bmi < 25){
     return "Normal weight";
   }
   if (bmi >= 25 && bmi < 30){
     return "Overweight";
   }
   if (bmi >= 30){
     return "Obesity";
   }

 }

  function getage(dateString) {
      var today = new Date();
      var birthDate = new Date(dateString);
      var age = today.getFullYear() - birthDate.getFullYear();
      var m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
      }
      return age;
  }

  function getchol(chol){
     var lchol = parseFloat(chol);
     if  (lchol <= 200){
       return "Cholesterol: Desirable";
     }
     if  (lchol > 200 && lchol <239){
       return "Cholesterol: Borderline high";
     }
     return "Cholesterol: High"

   }
