import {ROKU_APPS} from "@/utilities/constants.js"
import {useEffect, useState} from "react"
import {sendRokuLaunchCommand, sendRokuQuery} from "@/utilities/http"
import {buttonPress} from "@/utilities/utils.js";

function RokuChannels({ setPowerOn }) {

    const [buttonPressTimer, setButtonPressTimer] = useState()

    useEffect(() => {
        const channelButtons = document.querySelectorAll(".channel-button")
        for (const button of channelButtons) {
                fetchIcon(button)
        }
    }, [])

    const fetchIcon = async (button) => {
        const channelId = button.value
        const cachedImageUrl = localStorage.getItem(`channelImage${channelId}`)

        if (cachedImageUrl) {
            try {
                await fetch(cachedImageUrl, {method: 'GET'})
                // If the image is still available, apply it to button then exit function
                button.style.backgroundImage = `url(${cachedImageUrl})`
                button.style.backgroundSize = "100% 100%"
                return;
            } catch (error) {
                // If the image is not available, remove the stale cached image URL from localStorage
                localStorage.removeItem(`channelImage${channelId}`)
            }
        }

        // fetch from Roku API
        let imageUrl
        let blob
        const response = await sendRokuQuery(`icon/${button.value}`)
        if (response.ok) {
            const buffer = await response.arrayBuffer()
            blob =  new Blob([buffer], { type: 'image/jpeg' })
            imageUrl =  URL.createObjectURL(blob)
            localStorage.setItem(`channelImage${channelId}`, imageUrl)
            button.style.backgroundImage = `url(${imageUrl})`
            button.style.backgroundSize = "100% 100%"
            console.log("Image loaded from API")
        } else {
            console.error("No Image for channelId = " + channelId)
            button.innerHTML = button.id
            button.style.color = "white"
        }
    }

    const handleClick = (event) => {
        sendRokuLaunchCommand(event.currentTarget)
        setPowerOn(true)
        buttonPress(event.currentTarget, buttonPressTimer, setButtonPressTimer)
    }

    return (
        <div id="roku-channels" className="w-full flex place-content-center gap-2">
            <div className="grid grid-cols-4 grid-rows-2 gap-3 w-full">
                { Object.values(ROKU_APPS.CHANNELS).map(CHANNEL => (
                    <button onClick={handleClick}
                            key={ CHANNEL.id }
                            id={ CHANNEL.label }
                            className="channel-button z-50"
                            value={ CHANNEL.id }
                    ></button>
                ))
                }
            </div>
        </div>
    );
}

export default RokuChannels;