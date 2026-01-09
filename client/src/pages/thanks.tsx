import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";

type VideoUploadResponse = {
  secure_url: string;
  public_id: string;
  bytes?: number;
  duration?: number;
  resource_type?: string;
};

export default function ThanksPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<VideoUploadResponse | null>(null);
  const [progress, setProgress] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cityState, setCityState] = useState("");
  const [connection, setConnection] = useState("");
  const [nurseName, setNurseName] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [updates, setUpdates] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const maxBytes = useMemo(() => 50 * 1024 * 1024, []); // 50MB limit (3-5 min videos at good quality)

  useEffect(() => {
  }, []);

  const onPickFile = (f: File | null) => {
    setShowSuccess(false);
    setUploaded(null);
    setError(null);
    setProgress(0);
    setFile(f);
  };

  const upload = async () => {
    setError(null);
    setUploaded(null);
    setProgress(0);
    setShowSuccess(false);

    if (!file) {
      setError("Please select a file first.");
      return;
    }

    if (file.size > maxBytes) {
      setError("File too large. Please keep it under 50MB (about 3-5 minutes of video).");
      return;
    }

    setIsUploading(true);
    try {
      const meta = {
        name: name?.trim() || "Anonymous",
        email: email?.trim() || "Not provided",
        location: cityState?.trim() || "Not specified",
        connection: connection?.trim() || "Supporter",
        nurse_name: nurseName?.trim() || "All nurses",
        message: message?.trim() || "Nursing Rocks!",
        consent: consent ? "Yes" : "No",
        updates_consent: updates ? "Yes" : "No",
        timestamp: new Date().toISOString(),
      };

      // 1) Get a presigned upload URL from our server (Backblaze B2, S3-compatible)
      const sigRes = await fetch("/api/videos/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type || "video/mp4" }),
      });

      if (!sigRes.ok) {
        const text = await sigRes.text().catch(() => "");
        throw new Error(`Could not prepare upload (${sigRes.status}). ${text}`);
      }

      const sigData = (await sigRes.json()) as any;

      // 2) Upload directly to Backblaze using the presigned URL (PUT)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setProgress(pct);
          }
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed (${xhr.status}). Please try again.`));
        });
        xhr.addEventListener("error", () => reject(new Error("Upload failed. Please try again.")));
        xhr.open("PUT", sigData.url);
        xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
        xhr.send(file);
      });

      const payload: VideoUploadResponse = {
        secure_url: sigData.publicUrl,
        public_id: sigData.videoId,
        bytes: file.size,
        resource_type: "video",
      };
      setUploaded(payload);
      // Save submission metadata to database
      try {
        await fetch('/api/video-submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: meta.name,
            email: meta.email,
            location: meta.location,
            connection: meta.connection,
            nurse_name: meta.nurse_name,
            message: meta.message,
            video_url: payload.secure_url,
            video_public_id: payload.public_id,
            video_source_key: sigData.key,
            video_duration: payload.duration,
            video_bytes: payload.bytes,
            resource_type: payload.resource_type,
            consent_given: consent,
            wants_updates: updates,
          }),
        });
      } catch (err) {
        console.error('Failed to save submission metadata:', err);
        // Don't block user experience if this fails
      }

      setShowSuccess(true);

    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed.";
      setError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Thanks, Nurses! — Upload Your Video</title>
        <meta
          name="description"
          content="Upload a short video message of appreciation for nurses. Thank you for all you do!"
        />
      </Helmet>

      <section className="py-6 sm:py-8 md:py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-4xl">
          <div className="content-box mb-8 bg-gradient-to-br from-primary/90 to-[hsl(180,65%,35%)] text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">NURSING ROCKS! 🎸</h1>
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
              <p className="text-white/95 leading-relaxed">
              Every message matters. We're celebrating healthcare heroes through music while addressing the critical nursing shortage. Your appreciation video becomes part of the movement. Let's let them know "We see you, we love nurses and Nursing Rocks!"
              </p>
            </div>
          </div>

          {!showSuccess ? (
            <div className="content-box">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">Share Your Appreciation</h2>
              <p className="text-muted-foreground text-center mb-2">Record a personal message for the nurses who've made a difference</p>
              <p className="text-muted-foreground text-center mb-8 text-sm italic">( remember to add the tag line "Nursing Rocks!" at the end of your message )</p>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
                <p className="text-blue-900 text-sm">
                💡 <strong>Quick Upload:</strong> Just add your video and hit submit! All other fields are optional.
                </p>
              </div>

              <div className="mb-6">
                <label className="block font-semibold mb-2">
                  Upload Your Video <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs ml-2">Optional fields below</span>
                </label>
                <div
                  className={`border-4 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ui-bevel-input-2026 ${
                    isDragging ? "border-primary bg-primary/5" : file ? "border-green-500 bg-green-50" : "border-primary/50 bg-primary/5"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const f = e.dataTransfer.files?.[0] || null;
                    onPickFile(f);
                  }}
                >
                  <div className="text-5xl mb-4">{file ? "✅" : "🎥"}</div>
                  <div className="text-primary font-semibold mb-2 text-lg">
                    {file ? "File ready! Click to change" : "Click to upload or drag your video here"}
                  </div>
                  <div className="text-muted-foreground text-sm">MP4, MOV, AVI, WMV • Max 50MB • 3-5 minutes recommended</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*,image/*,audio/*"
                    style={{ display: "none" }}
                    onChange={(e) => onPickFile(e.target.files?.[0] || null)}
                    disabled={isUploading}
                  />
                </div>

                {file && (
                  <div className="mt-4 p-4 bg-muted rounded-lg" aria-live="polite">
                    <strong>Selected:</strong> {file.name}
                    <br />
                    <strong>Size:</strong>{" "}
                    {Math.round((file.size / (1024 * 1024)) * 100) / 100} MB
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="block font-semibold mb-2">
                  Your Name <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs ml-2">Optional</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  disabled={isUploading}
                  className="w-full px-4 py-3 border-2 border-border rounded-lg ui-bevel-input-2026 focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <div className="mb-6">
                <label className="block font-semibold mb-2">
                  Email Address <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs ml-2">Optional</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={isUploading}
                  className="w-full px-4 py-3 border-2 border-border rounded-lg ui-bevel-input-2026 focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <div className="mb-6">
                <label className="block font-semibold mb-2">
                  City/State <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs ml-2">Optional</span>
                </label>
                <input
                  type="text"
                  value={cityState}
                  onChange={(e) => setCityState(e.target.value)}
                  placeholder="Phoenix, AZ"
                  disabled={isUploading}
                  className="w-full px-4 py-3 border-2 border-border rounded-lg ui-bevel-input-2026 focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <div className="mb-6">
                <label className="block font-semibold mb-2">
                  Your Connection to Nursing <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs ml-2">Optional</span>
                </label>
                <select
                  value={connection}
                  onChange={(e) => setConnection(e.target.value)}
                  disabled={isUploading}
                  className="w-full px-4 py-3 border-2 border-border rounded-lg ui-bevel-input-2026 focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="">Select your connection...</option>
                  <option value="patient">I'm a grateful patient</option>
                  <option value="family">Family member of a nurse</option>
                  <option value="colleague">Healthcare colleague</option>
                  <option value="friend">Friend of a nurse</option>
                  <option value="nurse">I'm a nurse</option>
                  <option value="student">Nursing student</option>
                  <option value="educator">Nursing educator</option>
                  <option value="community">Community member</option>
                  <option value="other">Other supporter</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block font-semibold mb-2">
                  Nurse's Name <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs ml-2">Optional</span>
                </label>
                <input
                  type="text"
                  value={nurseName}
                  onChange={(e) => setNurseName(e.target.value)}
                  placeholder="If dedicating to a specific nurse"
                  disabled={isUploading}
                  className="w-full px-4 py-3 border-2 border-border rounded-lg ui-bevel-input-2026 focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <div className="mb-6">
                <label className="block font-semibold mb-2">
                  Your Written Message <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs ml-2">Optional</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share why nursing rocks and what nurses mean to you. This can accompany your video or stand alone."
                  disabled={isUploading}
                  className="w-full px-4 py-3 border-2 border-border rounded-lg ui-bevel-input-2026 focus:border-primary focus:outline-none transition-colors resize-vertical min-h-[120px]"
                />
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg mb-4">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  disabled={isUploading}
                  className="mt-1 w-5 h-5 cursor-pointer"
                />
                <label htmlFor="consent" className="cursor-pointer leading-relaxed">
                  I grant Nursing Rocks! permission to use this video for our appreciation campaigns, concerts, and nursing recruitment initiatives. I understand my message may be shared publicly to celebrate and support nurses.
                </label>
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg mb-6">
                <input
                  type="checkbox"
                  id="updates"
                  checked={updates}
                  onChange={(e) => setUpdates(e.target.checked)}
                  disabled={isUploading}
                  className="mt-1 w-5 h-5 cursor-pointer"
                />
                <label htmlFor="updates" className="cursor-pointer leading-relaxed">
                  Yes, I'd like to receive updates about Nursing Rocks! concerts and how we're supporting nursing education
                </label>
              </div>

              <Button 
                onClick={upload} 
                disabled={!file || isUploading}
                size="lg"
                className="w-full ui-bevel-2026"
              >
                {isUploading ? "Uploading..." : "Submit Your Appreciation"}
              </Button>

              {(isUploading || progress > 0) && (
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-6" aria-label="Upload progress">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300" 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
              )}

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-900">
                  {error}
                </div>
              )}

              {uploaded?.secure_url && (
                <div className="mt-4 rounded-xl overflow-hidden border-2 border-border bg-black">
                  {uploaded.resource_type === "image" ? (
                    <img src={uploaded.secure_url} alt="Uploaded" className="w-full" />
                  ) : uploaded.resource_type === "video" ? (
                    <video src={uploaded.secure_url} controls className="w-full" />
                  ) : (
                    <audio src={uploaded.secure_url} controls className="w-full" />
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="content-box">
              <div className="bg-green-500 text-white p-6 rounded-lg text-center">
                <p className="text-xl font-semibold">
                🎉 Thank you! Your message of appreciation has been received and will help us celebrate the amazing nurses who keep our communities healthy. Together, we're showing the world that NURSING ROCKS!
                </p>
              </div>
              {uploaded?.secure_url && (
                <div className="mt-6 rounded-xl overflow-hidden border-2 border-border bg-black">
                  {uploaded.resource_type === "image" ? (
                    <img src={uploaded.secure_url} alt="Uploaded" className="w-full" />
                  ) : uploaded.resource_type === "video" ? (
                    <video src={uploaded.secure_url} controls className="w-full" />
                  ) : (
                    <audio src={uploaded.secure_url} controls className="w-full" />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}


