import React from "react";
import Form from "react-bootstrap/Form";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import "./StartupProgress.css";
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import Alert from "react-bootstrap/Alert";
import axios from "axios";

const API_URL = "http://localhost:3000/";
const client = new ApolloClient({
  uri: API_URL,
  cache: new InMemoryCache(),
});

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      phases: [],
      tasks: [],
      sucessMessage: "",
    };
  }

  componentDidMount() {
    this.getPhases();
    if (this.state.tasks.every((task) => task.isCompleted)) {
      this.getSucessMessage();
    }
  }

  getPhases() {
    client
      .query({
        query: gql`
          query GetAllPhasesAndTasks {
            returnAllPhases {
              phaseId
              name
              order
            }
            returnAllTasks {
              phaseId
              taskId
              name
              isCompleted
            }
          }
        `,
      })
      .then((result) => {
        this.setState({
          phases: result.data.returnAllPhases,
          tasks: result.data.returnAllTasks,
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  updateTask(taskId, isCompleted) {
    client
      .mutate({
        mutation: gql`
          mutation updateTaskIsCompleted($taskId: ID!, $isCompleted: Boolean!) {
            updateTaskIsCompleted(
              data: { taskId: $taskId, isCompleted: $isCompleted }
            ) {
              phaseId
              isCompleted
            }
          }
        `,
        variables: {
          taskId: taskId,
          isCompleted: isCompleted,
        },
      })
      .then((result) => {
        console.log(result);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  createPhaseUI() {
    return this.state.phases.map((phase) => (
      <div>
        {this.createPhaseOrderUI(phase.order)}
        <h3 className="phaseTitle">{phase.name}</h3>
        <h3 className="phaseComplete">{this.createCheckUI(phase.phaseId)}</h3>
        {this.createTaskUI(phase.phaseId)}
      </div>
    ));
  }

  createTaskUI(phaseId) {
    return this.state.tasks
      .filter((task) => task.phaseId === phaseId)
      .map((task) => (
        <Form.Check
          className="checkboxTask"
          type="checkbox"
          id={task.taskId}
          label={task.name}
          checked={task.isCompleted}
          disabled={!this.isPhaseEnabled(phaseId)}
          onChange={this.handleChange.bind(this, task)}
        />
      ));
  }

  createPhaseOrderUI(order) {
    return <div className="phaseOrder">{order}</div>;
  }

  createCheckUI(phaseId) {
    const isPhaseCompleted = this.state.tasks
      .filter((task) => task.phaseId === phaseId)
      .every((task) => task.isCompleted);

    if (isPhaseCompleted) {
      return "✔";
    } else {
      return "";
    }
  }

  createSuccessUI() {
    if (this.state.tasks.every((task) => task.isCompleted)) {
      return (
        <div className="successAlert">
          <Alert variant="success">{this.state.successMessage}</Alert>
        </div>
      );
    } else {
      return <div></div>;
    }
  }

  getSucessMessage() {
    this.setState({ successMessage: "" });
    axios.get(`https://uselessfacts.jsph.pl/random.json`).then((res) => {
      this.setState({ successMessage: res.data.text });
    });
  }

  isPhaseEnabled(phaseId) {
    const phaseToCheck = this.state.phases.find(
      (phase) => phase.phaseId === phaseId
    );

    if (phaseToCheck.order === 1) {
      return true;
    }

    const previousPhaseId = this.state.phases.find(
      (phase) => phase.order === phaseToCheck.order - 1
    ).phaseId;
    const areAllPreviousTasksDone = this.state.tasks
      .filter((task) => task.phaseId === previousPhaseId)
      .every((task) => task.isCompleted);
    return areAllPreviousTasksDone;
  }

  handleChange(task, event) {
    this.updateTaskState(task.taskId, event.target.checked);
  }

  updateTaskState(taskId, isCompleted) {
    // TODO Uncheck all next phases tasks if one of previous tasks is unchecked.

    let values = [...this.state.tasks];
    const index = values.findIndex((x) => x.taskId === taskId);
    values[index] = {
      phaseId: values[index].phaseId,
      taskId: values[index].taskId,
      name: values[index].name,
      isCompleted: isCompleted,
    };
    this.setState({ tasks: values });
    this.updateTask(taskId, isCompleted);

    if (values.every((task) => task.isCompleted)) {
      this.getSucessMessage();
    }
  }

  render() {
    return (
      <Container>
        <Row>
          <Col md={{ span: 6 }}>
            <h3 className="title">My Startup Progress</h3>
            {this.createPhaseUI()}
            {this.createSuccessUI()}
          </Col>
        </Row>
      </Container>
    );
  }
}

export default App;
