export function parseStatus(text: string) {
    return /ongoing/gi.test(text);
}

export function numberFromTitle(title: string) {
    title = (title || '').trim().toLowerCase();
    if (!title) return -1;

    const match = /ch(ap(ter)?)?( +|\.)?(?<number>\d+(\.\d+)?)/.exec(title);
    if (match) {
        return +match.groups!.number;
    }

    title = title.replace(/vol(ume)?( +|\.)?(\d+(\.\d+)?)/g, '');

    const match2 = /(\d+(\.\d+)?)/.exec(title);
    if (match2) {
        return +match2[1];
    }

    return -1;
}

export function toTime(postedString: string) {
    postedString = postedString
        .trim()
        .replace(/^(an|one|a)/i, '1')
        .replace(/[ \t\n\r]+/g, '');

    if (/n(o|e)w|hot/.test(postedString)) {
        return Date.now();
    }

    const number = '(?<number>\\d+(\\.\\d+)?)';
    let ms = 0;
    let m: RegExpExecArray | null;
    let n: number;
    if ((m = new RegExp(number + 'y', 'gi').exec(postedString))) {
        n = +m.groups!.number;
        ms = n * 3.154e10;
    } else if ((m = new RegExp(number + 'mo', 'gi').exec(postedString))) {
        n = +m.groups!.number;
        ms = n * 2.628e9;
    } else if ((m = new RegExp(number + 'w', 'gi').exec(postedString))) {
        n = +m.groups!.number;
        ms = n * 6.048e8;
    } else if ((m = new RegExp(number + 'd', 'gi').exec(postedString))) {
        n = +m.groups!.number;
        ms = n * 8.64e7;
    } else if ((m = new RegExp(number + 'h', 'gi').exec(postedString))) {
        n = +m.groups!.number;
        ms = n * 3.6e6;
    } else if ((m = new RegExp(number + 'm', 'gi').exec(postedString))) {
        n = +m.groups!.number;
        ms = n * 60000;
    } else if ((m = new RegExp(number + 's', 'gi').exec(postedString))) {
        n = +m.groups!.number;
        ms = n * 1000;
    }

    if (ms !== 0) {
        return Date.now() - ms;
    } else {
        return -1;
    }
}
