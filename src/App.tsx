import React from "react";
import "./styles.css";
import { ProcessMapView } from "./components/process-map/process-map-view";

export default function App() {
  return (
    <div className="App">
      <ProcessMapView frameworkId="standard-cps-framework" />
    </div>
  );
}
