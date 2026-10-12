/** A quiet frame and progress score, shared by the two cinematic stages. */
export function JourneyChrome({ chapter }: { chapter: 1 | 2 }) {
  return (
    <>
      <div className="v-scene-frame" aria-hidden="true" />
      <div className="v-scene-topline" aria-hidden="true">
        <span lang="en">CRAFTING A NEW CHAPTER</span>
        <span>
          <b>0{chapter}</b> / 02
        </span>
      </div>
      <div className="v-scene-bottom">
        <div className="v-scene-score" aria-hidden="true">
          <div className="v-scene-chapters">
            <span data-current={chapter === 1}>
              01 <b>การฝึกฝน</b>
            </span>
            <span data-current={chapter === 2}>
              02 <b>โอกาสใหม่</b>
            </span>
          </div>
          <div className="v-scene-progress">
            <span />
          </div>
          <span className="v-scene-caption">ภาพประกอบแนวคิดการฝึกวิชาชีพ</span>
        </div>
        <a className="v-scene-skip" href="#collections">
          สำรวจผลงาน <span aria-hidden="true">↘</span>
        </a>
      </div>
    </>
  );
}
