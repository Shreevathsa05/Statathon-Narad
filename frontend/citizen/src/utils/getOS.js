export const getOS = () => {
	if (navigator.userAgentData?.platform) {
		console.log(navigator.userAgent, navigator.userAgentData)
		return navigator.userAgentData.platform;
	}

	const ua = navigator.userAgent;

	if (ua.includes("Windows")) return "Windows";
	if (ua.includes("Mac OS")) return "MacOS";
	if (ua.includes("Linux")) return "Linux";
	if (/Android/i.test(ua)) return "Android";
	if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";

	return "Unknown";
}