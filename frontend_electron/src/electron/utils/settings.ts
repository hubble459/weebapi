import ElectronStore = require('electron-store');

interface ISettings {
    check: boolean;
}

const settings = new ElectronStore<ISettings>({
    configFileMode: 0o666,
    defaults: {
        check: false,
    },
});

export default settings;
