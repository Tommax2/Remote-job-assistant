import logo from '../apply-logo-transparent.png'

export default function BrandLockup({ compact = false }) {
  return <span className={`applylumo-logo${compact ? ' compact' : ''}`}>
    <img src={logo} alt="ApplyLumo — Find. Match. Apply." />
    <img className="logo-light-lettering" src={logo} alt="" aria-hidden="true" />
  </span>
}
