import { createContext, useContext, useState } from "react";

const DEFAULT_STATE = {
  basement: {
    powerState: false,
    brightness: 50,
  },
  bedroom: {
    powerState: false,
  },
  stairway: {
    powerState: false,
  },
  loading: false,
};

const Context = createContext();

export function TplinkProvider({ children }) {
  const [tplinkState, setTplinkState] = useState(DEFAULT_STATE);

  const updateTplinkState = (props) => {
    setTplinkState((prevState) => ({ ...prevState, ...props }));
  };

  const refreshSwitchInfo = async (switchName) => {
    updateTplinkState({ loading: true });
    const response = await fetch(`api/tp-link/info/${switchName}`);
    if (200 !== response.status) {
      return console.error(response.error);
    }
    updateTplinkState(await response.json());
    updateTplinkState({ loading: false });
  };

  return (
    <Context.Provider
      value={[
        tplinkState,
        updateTplinkState,
        refreshSwitchInfo,
        setTplinkState,
      ]}
    >
      {children}
    </Context.Provider>
  );
}

export function useTplinkContext() {
  return useContext(Context);
}
