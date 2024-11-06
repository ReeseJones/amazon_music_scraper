import {css} from 'lit';

export const styles = css`
:host {
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 100%;
    box-sizing: border-box;
}

.header {
  background-color:#000000;
}

table {
  border: 8px solid black;
  padding: 0;
  margin: 0;
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

tr {
  margin: 0;
  background-color:#333333;
  border: 0;
  padding: 0;
  display: flex;
  flex-direction: row;
  width: 100%;
}

th {
  border-left: 4px solid #101010;
  border-right: 4px solid #101010;
  margin: 0;
  border: 1px solid #ddd;
  text-align: left;
  color: white;
  display: flex;
  flex: 1 1 0;
  padding: 16px;
}

tbody {
  flex: 1;
  display: flex;
}

thead {
  flex: 0 0 auto;
  display: flex;
}

thead tr {
  width: calc(100% - 16px);
}

table tr:nth-child(even) {
  background-color: #232323;
}
`;