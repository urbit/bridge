import cn from 'classnames';
import 'style/master-key.scss';
import withFadeable from './withFadeable';

export const MasterKey = ({ paused = false }) => {
  return (
    <svg className={cn({ 'master-key': true, paused })} viewBox="0 0 300 32">
      <g>
        <path
          className="segment-1"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M2 0a2 2 0 00-2 2v12a2 2 0 002 2h41a2 2 0 002-2V2a2 2 0 00-2-2H2zm41 2H2v12h41V2z"
        />
        <path
          className="segment-2"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M48 17C48 14.7909 49.7909 13 52 13H57C59.2091 13 61 14.7909 61 17V28C61 30.2091 59.2091 32 57 32H4C1.79086 32 0 30.2091 0 28V24C0 21.7909 1.79086 20 4 20H46C47.1046 20 48 19.1046 48 18V17ZM52 15C50.8954 15 50 15.8954 50 17V18C50 20.2091 48.2091 22 46 22H4C2.89543 22 2 22.8954 2 24V28C2 29.1046 2.89543 30 4 30H57C58.1046 30 59 29.1046 59 28V17C59 15.8954 58.1046 15 57 15H52Z"
        />
        <path
          className="segment-3"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M48 2C48 0.89543 48.8954 0 50 0H59C60.1046 0 61 0.895431 61 2V7C61 8.10457 60.1046 9 59 9H50C48.8954 9 48 8.10457 48 7V2ZM50 2H59V7H50V2Z"
        />
        <path
          className="segment-4"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M77 2C77 0.89543 77.8954 0 79 0H88C89.1046 0 90 0.895431 90 2V22C90 23.1046 89.1046 24 88 24H79C77.8954 24 77 23.1046 77 22V2ZM79 2H88V22H79V2Z"
        />
        <path
          className="segment-5"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M77 28C77 26.8954 77.8954 26 79 26H109C110.105 26 111 26.8954 111 28V30C111 31.1046 110.105 32 109 32H79C77.8954 32 77 31.1046 77 30V28ZM109 28V30H79V28H109Z"
        />
        <path
          className="segment-6"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M94 2C94 0.89543 94.8954 0 96 0H115C116.105 0 117 0.895431 117 2V14C117 15.1046 117.895 16 119 16H129C130.105 16 131 16.8954 131 18V30C131 31.1046 130.105 32 129 32H114.951C113.847 32 112.951 31.1046 112.951 30V26C112.951 24.8954 112.056 24 110.951 24H96C94.8954 24 94 23.1046 94 22V2ZM96 2V22H110.951C113.16 22 114.951 23.7909 114.951 26V30H129V18H119C116.791 18 115 16.2091 115 14V2H96Z"
        />
        <path
          className="segment-7"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M131 6C131 9.31371 128.314 12 125 12C121.686 12 119 9.31371 119 6C119 2.68629 121.686 0 125 0C128.314 0 131 2.68629 131 6ZM129 6C129 8.20914 127.209 10 125 10C122.791 10 121 8.20914 121 6C121 3.79086 122.791 2 125 2C127.209 2 129 3.79086 129 6Z"
        />
        <path
          className="segment-8"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M135 1C133.895 1 133 1.89543 133 3V18C133 19.1046 133.895 20 135 20H143C144.105 20 145 19.1046 145 18V3C145 1.89543 144.105 1 143 1H135ZM143 3H135V18H143V3Z"
        />
        <path
          className="segment-9"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M133 25C133 23.8954 133.895 23 135 23H143C144.105 23 145 23.8954 145 25V30C145 31.1046 144.105 32 143 32H135C133.895 32 133 31.1046 133 30V25ZM135 25H143V30H135V25Z"
        />
        <path
          className="segment-10"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M163 0C161.895 0 161 0.895431 161 2V6C161 7.10457 161.895 8 163 8H167C168.105 8 169 7.10457 169 6V2C169 0.895431 168.105 0 167 0H163ZM167 2H163V6H167V2Z"
        />
        <path
          className="segment-11"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M161 12C161 10.8954 161.895 10 163 10H167C168.105 10 169 10.8954 169 12V16C169 17.1046 168.105 18 167 18H163C161.895 18 161 17.1046 161 16V12ZM163 12H167V16H163V12Z"
        />
        <path
          className="segment-12"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M171 2C171 0.89543 171.895 0 173 0H181C182.105 0 183 0.895431 183 2V17C183 18.1046 182.105 19 181 19H173C171.895 19 171 18.1046 171 17V2ZM173 2H181V17H173V2Z"
        />
        <path
          className="segment-13"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M185 2C185 0.89543 185.895 0 187 0H215C216.105 0 217 0.895432 217 2V9C217 10.1046 216.105 11 215 11H199C197.895 11 197 11.8954 197 13V17C197 18.1046 196.105 19 195 19H187C185.895 19 185 18.1046 185 17V2ZM187 2V17H195V13C195 10.7909 196.791 9 199 9H215V2H187Z"
        />
        <path
          className="segment-14"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M161 30C161 31.1046 161.895 32 163 32H215C216.105 32 217 31.1046 217 30V15C217 13.8954 216.105 13 215 13H201C199.895 13 199 13.8954 199 15V20C199 21.1046 198.105 22 197 22H163C161.895 22 161 22.8954 161 24V30ZM163 30V24H197C199.209 24 201 22.2091 201 20V15H215V30H163Z"
        />
        <path
          className="segment-15"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M235 0C233.895 0 233 0.89543 233 2V4C233 5.10457 233.895 6 235 6H267C268.105 6 269 5.10457 269 4V2C269 0.895431 268.105 0 267 0H235ZM267 2H235V4H267V2Z"
        />
        <path
          className="segment-16"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M233 11C233 9.89543 233.895 9 235 9H257C258.105 9 259 9.89543 259 11V13C259 14.1046 259.895 15 261 15H269C270.105 15 271 15.8954 271 17V20C271 21.1046 271.895 22 273 22H282C283.105 22 284 22.8954 284 24V30C284 31.1046 283.105 32 282 32H235C233.895 32 233 31.1046 233 30V11ZM235 11H257V13C257 15.2091 258.791 17 261 17H269V20C269 22.2091 270.791 24 273 24H282V30H235V11Z"
        />
        <path
          className="segment-17"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M271 2C271 0.89543 271.895 0 273 0H298C299.105 0 300 0.895431 300 2V17C300 18.1046 299.105 19 298 19H281.588C280.478 19 279.418 18.5386 278.661 17.7261L272.073 10.652C271.383 9.91162 271 8.93752 271 7.92585V2ZM273 2H298V17H281.588C281.033 17 280.503 16.7693 280.125 16.3631L273.536 9.2889C273.192 8.91873 273 8.43168 273 7.92585V2Z"
        />
        <path
          className="segment-18"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M287 24C287 22.8954 287.895 22 289 22H298C299.105 22 300 22.8954 300 24V30C300 31.1046 299.105 32 298 32H289C287.895 32 287 31.1046 287 30V24ZM289 24H298V30H289V24Z"
        />
      </g>
    </svg>
  );
};

export const FadeableMasterKey = withFadeable(MasterKey);
