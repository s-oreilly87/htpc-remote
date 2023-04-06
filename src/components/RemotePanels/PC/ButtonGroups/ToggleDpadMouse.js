import {useState} from 'react'
import {Switch} from '@headlessui/react'

const ToggleDpadMouse = (props) => {

    const [enabled, setEnabled] = useState(false)

    return (
        <div className="mx-auto self-end">
            <Switch
                checked={enabled}
                onChange={setEnabled}
                className={`${
                    enabled ? 'bg-blue-600' : 'bg-gray-400'
                } relative inline-flex h-6 w-11 items-center rounded-full`}
            >
                <span className="sr-only">D-Pad Mouse</span>
                <span
                    className={`${
                        enabled ? 'translate-x-6 bg-white' : 'translate-x-1 bg-blue-600'
                    } inline-block h-4 w-4 transform rounded-full  transition`}
                />
            </Switch>
        </div>
    );


        {/*    <div className="col-12 justify-content-end align-items-center d-flex" style={{flexDirection:'column'}}>*/}
        {/*        <div className="row text-center" style={{width:'100%'}}>*/}
        {/*            <span className="form-check-label text-light">Dpad Mouse Control</span>*/}
        {/*        </div>*/}
        {/*        <div className="form-check form-switch row d-flex justify-content-center align-items-end"*/}
        {/*             style={{width:'100%'}}>*/}
        {/*            <input id="toggle-mouse" className="form-check-input form-check-input-lg" value="mouseEnabled"*/}
        {/*                   type="checkbox" style={{transform:'scale(2,2)'}}/>*/}
        {/*        </div>*/}
        {/*    </div>*/}
        {/*</div>*/}

}

export default ToggleDpadMouse;