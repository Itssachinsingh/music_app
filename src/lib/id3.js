// Minimal ID3v2.3 / v2.4 reader: title, artist, album and embedded cover art
const TEXT_FRAMES = { TIT2: "title", TPE1: "artist", TALB: "album" };

const syncsafe = (b, o) => (b[o] << 21) | (b[o + 1] << 14) | (b[o + 2] << 7) | b[o + 3];
const uint32 = (b, o) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;

const decoders = {};
const decode = (bytes, encoding) => {
  let label = "iso-8859-1";
  let start = 0;
  if (encoding === 1) {
    const be = bytes[0] === 0xfe && bytes[1] === 0xff;
    const le = bytes[0] === 0xff && bytes[1] === 0xfe;
    label = be ? "utf-16be" : "utf-16le";
    start = be || le ? 2 : 0;
  } else if (encoding === 2) {
    label = "utf-16be";
  } else if (encoding === 3) {
    label = "utf-8";
  }
  if (!decoders[label]) decoders[label] = new TextDecoder(label);
  return decoders[label].decode(bytes.subarray(start));
};

const readText = (body) =>
  decode(body.subarray(1), body[0])
    .replace(/\0+$/, "")
    .replace(/\0/g, ", ")
    .trim();

const readPicture = (body) => {
  const encoding = body[0];
  let i = 1;
  while (i < body.length && body[i] !== 0) i++;
  let mime = decode(body.subarray(1, i), 0).toLowerCase();
  i += 2; // mime terminator + picture type byte

  // Skip the description, whose terminator width depends on the text encoding
  if (encoding === 1 || encoding === 2) {
    while (i + 1 < body.length && (body[i] !== 0 || body[i + 1] !== 0)) i += 2;
    i += 2;
  } else {
    while (i < body.length && body[i] !== 0) i++;
    i += 1;
  }

  if (!mime.includes("/")) mime = `image/${mime === "jpg" || !mime ? "jpeg" : mime}`;
  return new Blob([body.subarray(i)], { type: mime });
};

export async function readTags(file) {
  const head = new Uint8Array(await file.slice(0, 10).arrayBuffer());
  if (head[0] !== 0x49 || head[1] !== 0x44 || head[2] !== 0x33) return {};

  const version = head[3];
  if (version < 3 || version > 4) return {};

  const size = syncsafe(head, 6);
  const data = new Uint8Array(await file.slice(10, 10 + size).arrayBuffer());
  let pos = 0;
  if (head[5] & 0x40) pos = version === 4 ? syncsafe(data, 0) : uint32(data, 0) + 4;

  const tags = {};
  while (pos + 10 <= data.length) {
    const id = String.fromCharCode(data[pos], data[pos + 1], data[pos + 2], data[pos + 3]);
    if (!/^[A-Z0-9]{4}$/.test(id)) break; // reached padding

    const frameSize = version === 4 ? syncsafe(data, pos + 4) : uint32(data, pos + 4);
    const body = data.subarray(pos + 10, pos + 10 + frameSize);
    pos += 10 + frameSize;
    if (!body.length) continue;

    if (TEXT_FRAMES[id]) tags[TEXT_FRAMES[id]] = readText(body);
    else if (id === "APIC" && !tags.picture) tags.picture = readPicture(body);
  }
  return tags;
}

export const readDuration = (file) =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    const done = (d) => {
      URL.revokeObjectURL(url);
      resolve(d);
    };
    audio.preload = "metadata";
    audio.onloadedmetadata = () => done(Number.isFinite(audio.duration) ? audio.duration : 0);
    audio.onerror = () => done(0);
    audio.src = url;
  });
