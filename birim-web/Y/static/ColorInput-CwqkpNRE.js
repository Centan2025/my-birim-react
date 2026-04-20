import {jsx as G, Fragment as Qc, jsxs as be} from 'react/jsx-runtime'
import {c as vt} from 'react/compiler-runtime'
import {
  c as rt,
  g as bt,
  B as eh,
  A as pp,
  F as Hr,
  a as Oe,
  S as vs,
  T as Lt,
  I as dp,
  C as Sr,
  b as gp,
  u as vp,
} from './sanity.config-BN7nEAqm.js'
import p, {
  isValidElement as bp,
  PureComponent as Br,
  Component as jr,
  useOptimistic as yp,
  useRef as mp,
  startTransition as Bt,
} from 'react'
import {unset as xp, set as jt, setIfMissing as _p} from 'sanity'
import {styled as $r} from 'styled-components'
import 'sanity/structure'
import '@sanity/vision'
import 'react-dom'
import 'sanity/router'
var re = {},
  Ge = {},
  $t,
  bs
function rh() {
  if (bs) return $t
  bs = 1
  var r = typeof rt == 'object' && rt && rt.Object === Object && rt
  return (($t = r), $t)
}
var Nt, ys
function ge() {
  if (ys) return Nt
  ys = 1
  var r = rh(),
    e = typeof self == 'object' && self && self.Object === Object && self,
    t = r || e || Function('return this')()
  return ((Nt = t), Nt)
}
var Gt, ms
function Nr() {
  if (ms) return Gt
  ms = 1
  var r = ge(),
    e = r.Symbol
  return ((Gt = e), Gt)
}
var Ut, xs
function wp() {
  if (xs) return Ut
  xs = 1
  var r = Nr(),
    e = Object.prototype,
    t = e.hasOwnProperty,
    n = e.toString,
    a = r ? r.toStringTag : void 0
  function i(o) {
    var s = t.call(o, a),
      u = o[a]
    try {
      o[a] = void 0
      var l = !0
    } catch {}
    var f = n.call(o)
    return (l && (s ? (o[a] = u) : delete o[a]), f)
  }
  return ((Ut = i), Ut)
}
var zt, _s
function Sp() {
  if (_s) return zt
  _s = 1
  var r = Object.prototype,
    e = r.toString
  function t(n) {
    return e.call(n)
  }
  return ((zt = t), zt)
}
var Wt, ws
function Fe() {
  if (ws) return Wt
  ws = 1
  var r = Nr(),
    e = wp(),
    t = Sp(),
    n = '[object Null]',
    a = '[object Undefined]',
    i = r ? r.toStringTag : void 0
  function o(s) {
    return s == null ? (s === void 0 ? a : n) : i && i in Object(s) ? e(s) : t(s)
  }
  return ((Wt = o), Wt)
}
var Kt, Ss
function se() {
  if (Ss) return Kt
  Ss = 1
  var r = Array.isArray
  return ((Kt = r), Kt)
}
var Vt, Cs
function me() {
  if (Cs) return Vt
  Cs = 1
  function r(e) {
    return e != null && typeof e == 'object'
  }
  return ((Vt = r), Vt)
}
var Xt, Es
function Cp() {
  if (Es) return Xt
  Es = 1
  var r = Fe(),
    e = se(),
    t = me(),
    n = '[object String]'
  function a(i) {
    return typeof i == 'string' || (!e(i) && t(i) && r(i) == n)
  }
  return ((Xt = a), Xt)
}
var Yt, Rs
function Ep() {
  if (Rs) return Yt
  Rs = 1
  function r(e) {
    return function (t, n, a) {
      for (var i = -1, o = Object(t), s = a(t), u = s.length; u--; ) {
        var l = s[e ? u : ++i]
        if (n(o[l], l, o) === !1) break
      }
      return t
    }
  }
  return ((Yt = r), Yt)
}
var Zt, Os
function th() {
  if (Os) return Zt
  Os = 1
  var r = Ep(),
    e = r()
  return ((Zt = e), Zt)
}
var Jt, As
function Rp() {
  if (As) return Jt
  As = 1
  function r(e, t) {
    for (var n = -1, a = Array(e); ++n < e; ) a[n] = t(n)
    return a
  }
  return ((Jt = r), Jt)
}
var Qt, Ts
function Op() {
  if (Ts) return Qt
  Ts = 1
  var r = Fe(),
    e = me(),
    t = '[object Arguments]'
  function n(a) {
    return e(a) && r(a) == t
  }
  return ((Qt = n), Qt)
}
var en, Ms
function wo() {
  if (Ms) return en
  Ms = 1
  var r = Op(),
    e = me(),
    t = Object.prototype,
    n = t.hasOwnProperty,
    a = t.propertyIsEnumerable,
    i = r(
      (function () {
        return arguments
      })(),
    )
      ? r
      : function (o) {
          return e(o) && n.call(o, 'callee') && !a.call(o, 'callee')
        }
  return ((en = i), en)
}
var Tr = {exports: {}},
  rn,
  Ps
function Ap() {
  if (Ps) return rn
  Ps = 1
  function r() {
    return !1
  }
  return ((rn = r), rn)
}
Tr.exports
var qs
function yt() {
  return (
    qs ||
      ((qs = 1),
      (function (r, e) {
        var t = ge(),
          n = Ap(),
          a = e && !e.nodeType && e,
          i = a && !0 && r && !r.nodeType && r,
          o = i && i.exports === a,
          s = o ? t.Buffer : void 0,
          u = s ? s.isBuffer : void 0,
          l = u || n
        r.exports = l
      })(Tr, Tr.exports)),
    Tr.exports
  )
}
var tn, ks
function So() {
  if (ks) return tn
  ks = 1
  var r = 9007199254740991,
    e = /^(?:0|[1-9]\d*)$/
  function t(n, a) {
    var i = typeof n
    return (
      (a = a ?? r),
      !!a && (i == 'number' || (i != 'symbol' && e.test(n))) && n > -1 && n % 1 == 0 && n < a
    )
  }
  return ((tn = t), tn)
}
var nn, Is
function Co() {
  if (Is) return nn
  Is = 1
  var r = 9007199254740991
  function e(t) {
    return typeof t == 'number' && t > -1 && t % 1 == 0 && t <= r
  }
  return ((nn = e), nn)
}
var an, Fs
function Tp() {
  if (Fs) return an
  Fs = 1
  var r = Fe(),
    e = Co(),
    t = me(),
    n = '[object Arguments]',
    a = '[object Array]',
    i = '[object Boolean]',
    o = '[object Date]',
    s = '[object Error]',
    u = '[object Function]',
    l = '[object Map]',
    f = '[object Number]',
    c = '[object Object]',
    h = '[object RegExp]',
    d = '[object Set]',
    g = '[object String]',
    v = '[object WeakMap]',
    b = '[object ArrayBuffer]',
    w = '[object DataView]',
    _ = '[object Float32Array]',
    C = '[object Float64Array]',
    S = '[object Int8Array]',
    E = '[object Int16Array]',
    R = '[object Int32Array]',
    A = '[object Uint8Array]',
    T = '[object Uint8ClampedArray]',
    I = '[object Uint16Array]',
    D = '[object Uint32Array]',
    k = {}
  ;((k[_] = k[C] = k[S] = k[E] = k[R] = k[A] = k[T] = k[I] = k[D] = !0),
    (k[n] =
      k[a] =
      k[b] =
      k[i] =
      k[w] =
      k[o] =
      k[s] =
      k[u] =
      k[l] =
      k[f] =
      k[c] =
      k[h] =
      k[d] =
      k[g] =
      k[v] =
        !1))
  function N(j) {
    return t(j) && e(j.length) && !!k[r(j)]
  }
  return ((an = N), an)
}
var on, Hs
function Eo() {
  if (Hs) return on
  Hs = 1
  function r(e) {
    return function (t) {
      return e(t)
    }
  }
  return ((on = r), on)
}
var Mr = {exports: {}}
Mr.exports
var Ds
function Ro() {
  return (
    Ds ||
      ((Ds = 1),
      (function (r, e) {
        var t = rh(),
          n = e && !e.nodeType && e,
          a = n && !0 && r && !r.nodeType && r,
          i = a && a.exports === n,
          o = i && t.process,
          s = (function () {
            try {
              var u = a && a.require && a.require('util').types
              return u || (o && o.binding && o.binding('util'))
            } catch {}
          })()
        r.exports = s
      })(Mr, Mr.exports)),
    Mr.exports
  )
}
var sn, Ls
function Oo() {
  if (Ls) return sn
  Ls = 1
  var r = Tp(),
    e = Eo(),
    t = Ro(),
    n = t && t.isTypedArray,
    a = n ? e(n) : r
  return ((sn = a), sn)
}
var un, Bs
function nh() {
  if (Bs) return un
  Bs = 1
  var r = Rp(),
    e = wo(),
    t = se(),
    n = yt(),
    a = So(),
    i = Oo(),
    o = Object.prototype,
    s = o.hasOwnProperty
  function u(l, f) {
    var c = t(l),
      h = !c && e(l),
      d = !c && !h && n(l),
      g = !c && !h && !d && i(l),
      v = c || h || d || g,
      b = v ? r(l.length, String) : [],
      w = b.length
    for (var _ in l)
      (f || s.call(l, _)) &&
        !(
          v &&
          (_ == 'length' ||
            (d && (_ == 'offset' || _ == 'parent')) ||
            (g && (_ == 'buffer' || _ == 'byteLength' || _ == 'byteOffset')) ||
            a(_, w))
        ) &&
        b.push(_)
    return b
  }
  return ((un = u), un)
}
var ln, js
function Ao() {
  if (js) return ln
  js = 1
  var r = Object.prototype
  function e(t) {
    var n = t && t.constructor,
      a = (typeof n == 'function' && n.prototype) || r
    return t === a
  }
  return ((ln = e), ln)
}
var fn, $s
function ah() {
  if ($s) return fn
  $s = 1
  function r(e, t) {
    return function (n) {
      return e(t(n))
    }
  }
  return ((fn = r), fn)
}
var cn, Ns
function Mp() {
  if (Ns) return cn
  Ns = 1
  var r = ah(),
    e = r(Object.keys, Object)
  return ((cn = e), cn)
}
var hn, Gs
function Pp() {
  if (Gs) return hn
  Gs = 1
  var r = Ao(),
    e = Mp(),
    t = Object.prototype,
    n = t.hasOwnProperty
  function a(i) {
    if (!r(i)) return e(i)
    var o = []
    for (var s in Object(i)) n.call(i, s) && s != 'constructor' && o.push(s)
    return o
  }
  return ((hn = a), hn)
}
var pn, Us
function fe() {
  if (Us) return pn
  Us = 1
  function r(e) {
    var t = typeof e
    return e != null && (t == 'object' || t == 'function')
  }
  return ((pn = r), pn)
}
var dn, zs
function To() {
  if (zs) return dn
  zs = 1
  var r = Fe(),
    e = fe(),
    t = '[object AsyncFunction]',
    n = '[object Function]',
    a = '[object GeneratorFunction]',
    i = '[object Proxy]'
  function o(s) {
    if (!e(s)) return !1
    var u = r(s)
    return u == n || u == a || u == t || u == i
  }
  return ((dn = o), dn)
}
var gn, Ws
function mr() {
  if (Ws) return gn
  Ws = 1
  var r = To(),
    e = Co()
  function t(n) {
    return n != null && e(n.length) && !r(n)
  }
  return ((gn = t), gn)
}
var vn, Ks
function Gr() {
  if (Ks) return vn
  Ks = 1
  var r = nh(),
    e = Pp(),
    t = mr()
  function n(a) {
    return t(a) ? r(a) : e(a)
  }
  return ((vn = n), vn)
}
var bn, Vs
function ih() {
  if (Vs) return bn
  Vs = 1
  var r = th(),
    e = Gr()
  function t(n, a) {
    return n && r(n, a, e)
  }
  return ((bn = t), bn)
}
var yn, Xs
function mt() {
  if (Xs) return yn
  Xs = 1
  function r(e) {
    return e
  }
  return ((yn = r), yn)
}
var mn, Ys
function oh() {
  if (Ys) return mn
  Ys = 1
  var r = mt()
  function e(t) {
    return typeof t == 'function' ? t : r
  }
  return ((mn = e), mn)
}
var xn, Zs
function Mo() {
  if (Zs) return xn
  Zs = 1
  var r = ih(),
    e = oh()
  function t(n, a) {
    return n && r(n, e(a))
  }
  return ((xn = t), xn)
}
var _n, Js
function Po() {
  if (Js) return _n
  Js = 1
  var r = ah(),
    e = r(Object.getPrototypeOf, Object)
  return ((_n = e), _n)
}
var wn, Qs
function sh() {
  if (Qs) return wn
  Qs = 1
  var r = Fe(),
    e = Po(),
    t = me(),
    n = '[object Object]',
    a = Function.prototype,
    i = Object.prototype,
    o = a.toString,
    s = i.hasOwnProperty,
    u = o.call(Object)
  function l(f) {
    if (!t(f) || r(f) != n) return !1
    var c = e(f)
    if (c === null) return !0
    var h = s.call(c, 'constructor') && c.constructor
    return typeof h == 'function' && h instanceof h && o.call(h) == u
  }
  return ((wn = l), wn)
}
var Sn, eu
function uh() {
  if (eu) return Sn
  eu = 1
  function r(e, t) {
    for (var n = -1, a = e == null ? 0 : e.length, i = Array(a); ++n < a; ) i[n] = t(e[n], n, e)
    return i
  }
  return ((Sn = r), Sn)
}
var Cn, ru
function qp() {
  if (ru) return Cn
  ru = 1
  function r() {
    ;((this.__data__ = []), (this.size = 0))
  }
  return ((Cn = r), Cn)
}
var En, tu
function Ur() {
  if (tu) return En
  tu = 1
  function r(e, t) {
    return e === t || (e !== e && t !== t)
  }
  return ((En = r), En)
}
var Rn, nu
function xt() {
  if (nu) return Rn
  nu = 1
  var r = Ur()
  function e(t, n) {
    for (var a = t.length; a--; ) if (r(t[a][0], n)) return a
    return -1
  }
  return ((Rn = e), Rn)
}
var On, au
function kp() {
  if (au) return On
  au = 1
  var r = xt(),
    e = Array.prototype,
    t = e.splice
  function n(a) {
    var i = this.__data__,
      o = r(i, a)
    if (o < 0) return !1
    var s = i.length - 1
    return (o == s ? i.pop() : t.call(i, o, 1), --this.size, !0)
  }
  return ((On = n), On)
}
var An, iu
function Ip() {
  if (iu) return An
  iu = 1
  var r = xt()
  function e(t) {
    var n = this.__data__,
      a = r(n, t)
    return a < 0 ? void 0 : n[a][1]
  }
  return ((An = e), An)
}
var Tn, ou
function Fp() {
  if (ou) return Tn
  ou = 1
  var r = xt()
  function e(t) {
    return r(this.__data__, t) > -1
  }
  return ((Tn = e), Tn)
}
var Mn, su
function Hp() {
  if (su) return Mn
  su = 1
  var r = xt()
  function e(t, n) {
    var a = this.__data__,
      i = r(a, t)
    return (i < 0 ? (++this.size, a.push([t, n])) : (a[i][1] = n), this)
  }
  return ((Mn = e), Mn)
}
var Pn, uu
function _t() {
  if (uu) return Pn
  uu = 1
  var r = qp(),
    e = kp(),
    t = Ip(),
    n = Fp(),
    a = Hp()
  function i(o) {
    var s = -1,
      u = o == null ? 0 : o.length
    for (this.clear(); ++s < u; ) {
      var l = o[s]
      this.set(l[0], l[1])
    }
  }
  return (
    (i.prototype.clear = r),
    (i.prototype.delete = e),
    (i.prototype.get = t),
    (i.prototype.has = n),
    (i.prototype.set = a),
    (Pn = i),
    Pn
  )
}
var qn, lu
function Dp() {
  if (lu) return qn
  lu = 1
  var r = _t()
  function e() {
    ;((this.__data__ = new r()), (this.size = 0))
  }
  return ((qn = e), qn)
}
var kn, fu
function Lp() {
  if (fu) return kn
  fu = 1
  function r(e) {
    var t = this.__data__,
      n = t.delete(e)
    return ((this.size = t.size), n)
  }
  return ((kn = r), kn)
}
var In, cu
function Bp() {
  if (cu) return In
  cu = 1
  function r(e) {
    return this.__data__.get(e)
  }
  return ((In = r), In)
}
var Fn, hu
function jp() {
  if (hu) return Fn
  hu = 1
  function r(e) {
    return this.__data__.has(e)
  }
  return ((Fn = r), Fn)
}
var Hn, pu
function $p() {
  if (pu) return Hn
  pu = 1
  var r = ge(),
    e = r['__core-js_shared__']
  return ((Hn = e), Hn)
}
var Dn, du
function Np() {
  if (du) return Dn
  du = 1
  var r = $p(),
    e = (function () {
      var n = /[^.]+$/.exec((r && r.keys && r.keys.IE_PROTO) || '')
      return n ? 'Symbol(src)_1.' + n : ''
    })()
  function t(n) {
    return !!e && e in n
  }
  return ((Dn = t), Dn)
}
var Ln, gu
function lh() {
  if (gu) return Ln
  gu = 1
  var r = Function.prototype,
    e = r.toString
  function t(n) {
    if (n != null) {
      try {
        return e.call(n)
      } catch {}
      try {
        return n + ''
      } catch {}
    }
    return ''
  }
  return ((Ln = t), Ln)
}
var Bn, vu
function Gp() {
  if (vu) return Bn
  vu = 1
  var r = To(),
    e = Np(),
    t = fe(),
    n = lh(),
    a = /[\\^$.*+?()[\]{}|]/g,
    i = /^\[object .+?Constructor\]$/,
    o = Function.prototype,
    s = Object.prototype,
    u = o.toString,
    l = s.hasOwnProperty,
    f = RegExp(
      '^' +
        u
          .call(l)
          .replace(a, '\\$&')
          .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') +
        '$',
    )
  function c(h) {
    if (!t(h) || e(h)) return !1
    var d = r(h) ? f : i
    return d.test(n(h))
  }
  return ((Bn = c), Bn)
}
var jn, bu
function Up() {
  if (bu) return jn
  bu = 1
  function r(e, t) {
    return e?.[t]
  }
  return ((jn = r), jn)
}
var $n, yu
function He() {
  if (yu) return $n
  yu = 1
  var r = Gp(),
    e = Up()
  function t(n, a) {
    var i = e(n, a)
    return r(i) ? i : void 0
  }
  return (($n = t), $n)
}
var Nn, mu
function qo() {
  if (mu) return Nn
  mu = 1
  var r = He(),
    e = ge(),
    t = r(e, 'Map')
  return ((Nn = t), Nn)
}
var Gn, xu
function wt() {
  if (xu) return Gn
  xu = 1
  var r = He(),
    e = r(Object, 'create')
  return ((Gn = e), Gn)
}
var Un, _u
function zp() {
  if (_u) return Un
  _u = 1
  var r = wt()
  function e() {
    ;((this.__data__ = r ? r(null) : {}), (this.size = 0))
  }
  return ((Un = e), Un)
}
var zn, wu
function Wp() {
  if (wu) return zn
  wu = 1
  function r(e) {
    var t = this.has(e) && delete this.__data__[e]
    return ((this.size -= t ? 1 : 0), t)
  }
  return ((zn = r), zn)
}
var Wn, Su
function Kp() {
  if (Su) return Wn
  Su = 1
  var r = wt(),
    e = '__lodash_hash_undefined__',
    t = Object.prototype,
    n = t.hasOwnProperty
  function a(i) {
    var o = this.__data__
    if (r) {
      var s = o[i]
      return s === e ? void 0 : s
    }
    return n.call(o, i) ? o[i] : void 0
  }
  return ((Wn = a), Wn)
}
var Kn, Cu
function Vp() {
  if (Cu) return Kn
  Cu = 1
  var r = wt(),
    e = Object.prototype,
    t = e.hasOwnProperty
  function n(a) {
    var i = this.__data__
    return r ? i[a] !== void 0 : t.call(i, a)
  }
  return ((Kn = n), Kn)
}
var Vn, Eu
function Xp() {
  if (Eu) return Vn
  Eu = 1
  var r = wt(),
    e = '__lodash_hash_undefined__'
  function t(n, a) {
    var i = this.__data__
    return ((this.size += this.has(n) ? 0 : 1), (i[n] = r && a === void 0 ? e : a), this)
  }
  return ((Vn = t), Vn)
}
var Xn, Ru
function Yp() {
  if (Ru) return Xn
  Ru = 1
  var r = zp(),
    e = Wp(),
    t = Kp(),
    n = Vp(),
    a = Xp()
  function i(o) {
    var s = -1,
      u = o == null ? 0 : o.length
    for (this.clear(); ++s < u; ) {
      var l = o[s]
      this.set(l[0], l[1])
    }
  }
  return (
    (i.prototype.clear = r),
    (i.prototype.delete = e),
    (i.prototype.get = t),
    (i.prototype.has = n),
    (i.prototype.set = a),
    (Xn = i),
    Xn
  )
}
var Yn, Ou
function Zp() {
  if (Ou) return Yn
  Ou = 1
  var r = Yp(),
    e = _t(),
    t = qo()
  function n() {
    ;((this.size = 0), (this.__data__ = {hash: new r(), map: new (t || e)(), string: new r()}))
  }
  return ((Yn = n), Yn)
}
var Zn, Au
function Jp() {
  if (Au) return Zn
  Au = 1
  function r(e) {
    var t = typeof e
    return t == 'string' || t == 'number' || t == 'symbol' || t == 'boolean'
      ? e !== '__proto__'
      : e === null
  }
  return ((Zn = r), Zn)
}
var Jn, Tu
function St() {
  if (Tu) return Jn
  Tu = 1
  var r = Jp()
  function e(t, n) {
    var a = t.__data__
    return r(n) ? a[typeof n == 'string' ? 'string' : 'hash'] : a.map
  }
  return ((Jn = e), Jn)
}
var Qn, Mu
function Qp() {
  if (Mu) return Qn
  Mu = 1
  var r = St()
  function e(t) {
    var n = r(this, t).delete(t)
    return ((this.size -= n ? 1 : 0), n)
  }
  return ((Qn = e), Qn)
}
var ea, Pu
function ed() {
  if (Pu) return ea
  Pu = 1
  var r = St()
  function e(t) {
    return r(this, t).get(t)
  }
  return ((ea = e), ea)
}
var ra, qu
function rd() {
  if (qu) return ra
  qu = 1
  var r = St()
  function e(t) {
    return r(this, t).has(t)
  }
  return ((ra = e), ra)
}
var ta, ku
function td() {
  if (ku) return ta
  ku = 1
  var r = St()
  function e(t, n) {
    var a = r(this, t),
      i = a.size
    return (a.set(t, n), (this.size += a.size == i ? 0 : 1), this)
  }
  return ((ta = e), ta)
}
var na, Iu
function ko() {
  if (Iu) return na
  Iu = 1
  var r = Zp(),
    e = Qp(),
    t = ed(),
    n = rd(),
    a = td()
  function i(o) {
    var s = -1,
      u = o == null ? 0 : o.length
    for (this.clear(); ++s < u; ) {
      var l = o[s]
      this.set(l[0], l[1])
    }
  }
  return (
    (i.prototype.clear = r),
    (i.prototype.delete = e),
    (i.prototype.get = t),
    (i.prototype.has = n),
    (i.prototype.set = a),
    (na = i),
    na
  )
}
var aa, Fu
function nd() {
  if (Fu) return aa
  Fu = 1
  var r = _t(),
    e = qo(),
    t = ko(),
    n = 200
  function a(i, o) {
    var s = this.__data__
    if (s instanceof r) {
      var u = s.__data__
      if (!e || u.length < n - 1) return (u.push([i, o]), (this.size = ++s.size), this)
      s = this.__data__ = new t(u)
    }
    return (s.set(i, o), (this.size = s.size), this)
  }
  return ((aa = a), aa)
}
var ia, Hu
function Ct() {
  if (Hu) return ia
  Hu = 1
  var r = _t(),
    e = Dp(),
    t = Lp(),
    n = Bp(),
    a = jp(),
    i = nd()
  function o(s) {
    var u = (this.__data__ = new r(s))
    this.size = u.size
  }
  return (
    (o.prototype.clear = e),
    (o.prototype.delete = t),
    (o.prototype.get = n),
    (o.prototype.has = a),
    (o.prototype.set = i),
    (ia = o),
    ia
  )
}
var oa, Du
function ad() {
  if (Du) return oa
  Du = 1
  var r = '__lodash_hash_undefined__'
  function e(t) {
    return (this.__data__.set(t, r), this)
  }
  return ((oa = e), oa)
}
var sa, Lu
function id() {
  if (Lu) return sa
  Lu = 1
  function r(e) {
    return this.__data__.has(e)
  }
  return ((sa = r), sa)
}
var ua, Bu
function od() {
  if (Bu) return ua
  Bu = 1
  var r = ko(),
    e = ad(),
    t = id()
  function n(a) {
    var i = -1,
      o = a == null ? 0 : a.length
    for (this.__data__ = new r(); ++i < o; ) this.add(a[i])
  }
  return ((n.prototype.add = n.prototype.push = e), (n.prototype.has = t), (ua = n), ua)
}
var la, ju
function sd() {
  if (ju) return la
  ju = 1
  function r(e, t) {
    for (var n = -1, a = e == null ? 0 : e.length; ++n < a; ) if (t(e[n], n, e)) return !0
    return !1
  }
  return ((la = r), la)
}
var fa, $u
function ud() {
  if ($u) return fa
  $u = 1
  function r(e, t) {
    return e.has(t)
  }
  return ((fa = r), fa)
}
var ca, Nu
function fh() {
  if (Nu) return ca
  Nu = 1
  var r = od(),
    e = sd(),
    t = ud(),
    n = 1,
    a = 2
  function i(o, s, u, l, f, c) {
    var h = u & n,
      d = o.length,
      g = s.length
    if (d != g && !(h && g > d)) return !1
    var v = c.get(o),
      b = c.get(s)
    if (v && b) return v == s && b == o
    var w = -1,
      _ = !0,
      C = u & a ? new r() : void 0
    for (c.set(o, s), c.set(s, o); ++w < d; ) {
      var S = o[w],
        E = s[w]
      if (l) var R = h ? l(E, S, w, s, o, c) : l(S, E, w, o, s, c)
      if (R !== void 0) {
        if (R) continue
        _ = !1
        break
      }
      if (C) {
        if (
          !e(s, function (A, T) {
            if (!t(C, T) && (S === A || f(S, A, u, l, c))) return C.push(T)
          })
        ) {
          _ = !1
          break
        }
      } else if (!(S === E || f(S, E, u, l, c))) {
        _ = !1
        break
      }
    }
    return (c.delete(o), c.delete(s), _)
  }
  return ((ca = i), ca)
}
var ha, Gu
function ch() {
  if (Gu) return ha
  Gu = 1
  var r = ge(),
    e = r.Uint8Array
  return ((ha = e), ha)
}
var pa, Uu
function ld() {
  if (Uu) return pa
  Uu = 1
  function r(e) {
    var t = -1,
      n = Array(e.size)
    return (
      e.forEach(function (a, i) {
        n[++t] = [i, a]
      }),
      n
    )
  }
  return ((pa = r), pa)
}
var da, zu
function fd() {
  if (zu) return da
  zu = 1
  function r(e) {
    var t = -1,
      n = Array(e.size)
    return (
      e.forEach(function (a) {
        n[++t] = a
      }),
      n
    )
  }
  return ((da = r), da)
}
var ga, Wu
function cd() {
  if (Wu) return ga
  Wu = 1
  var r = Nr(),
    e = ch(),
    t = Ur(),
    n = fh(),
    a = ld(),
    i = fd(),
    o = 1,
    s = 2,
    u = '[object Boolean]',
    l = '[object Date]',
    f = '[object Error]',
    c = '[object Map]',
    h = '[object Number]',
    d = '[object RegExp]',
    g = '[object Set]',
    v = '[object String]',
    b = '[object Symbol]',
    w = '[object ArrayBuffer]',
    _ = '[object DataView]',
    C = r ? r.prototype : void 0,
    S = C ? C.valueOf : void 0
  function E(R, A, T, I, D, k, N) {
    switch (T) {
      case _:
        if (R.byteLength != A.byteLength || R.byteOffset != A.byteOffset) return !1
        ;((R = R.buffer), (A = A.buffer))
      case w:
        return !(R.byteLength != A.byteLength || !k(new e(R), new e(A)))
      case u:
      case l:
      case h:
        return t(+R, +A)
      case f:
        return R.name == A.name && R.message == A.message
      case d:
      case v:
        return R == A + ''
      case c:
        var j = a
      case g:
        var V = I & o
        if ((j || (j = i), R.size != A.size && !V)) return !1
        var B = N.get(R)
        if (B) return B == A
        ;((I |= s), N.set(R, A))
        var ce = n(j(R), j(A), I, D, k, N)
        return (N.delete(R), ce)
      case b:
        if (S) return S.call(R) == S.call(A)
    }
    return !1
  }
  return ((ga = E), ga)
}
var va, Ku
function hh() {
  if (Ku) return va
  Ku = 1
  function r(e, t) {
    for (var n = -1, a = t.length, i = e.length; ++n < a; ) e[i + n] = t[n]
    return e
  }
  return ((va = r), va)
}
var ba, Vu
function ph() {
  if (Vu) return ba
  Vu = 1
  var r = hh(),
    e = se()
  function t(n, a, i) {
    var o = a(n)
    return e(n) ? o : r(o, i(n))
  }
  return ((ba = t), ba)
}
var ya, Xu
function hd() {
  if (Xu) return ya
  Xu = 1
  function r(e, t) {
    for (var n = -1, a = e == null ? 0 : e.length, i = 0, o = []; ++n < a; ) {
      var s = e[n]
      t(s, n, e) && (o[i++] = s)
    }
    return o
  }
  return ((ya = r), ya)
}
var ma, Yu
function dh() {
  if (Yu) return ma
  Yu = 1
  function r() {
    return []
  }
  return ((ma = r), ma)
}
var xa, Zu
function Io() {
  if (Zu) return xa
  Zu = 1
  var r = hd(),
    e = dh(),
    t = Object.prototype,
    n = t.propertyIsEnumerable,
    a = Object.getOwnPropertySymbols,
    i = a
      ? function (o) {
          return o == null
            ? []
            : ((o = Object(o)),
              r(a(o), function (s) {
                return n.call(o, s)
              }))
        }
      : e
  return ((xa = i), xa)
}
var _a, Ju
function gh() {
  if (Ju) return _a
  Ju = 1
  var r = ph(),
    e = Io(),
    t = Gr()
  function n(a) {
    return r(a, t, e)
  }
  return ((_a = n), _a)
}
var wa, Qu
function pd() {
  if (Qu) return wa
  Qu = 1
  var r = gh(),
    e = 1,
    t = Object.prototype,
    n = t.hasOwnProperty
  function a(i, o, s, u, l, f) {
    var c = s & e,
      h = r(i),
      d = h.length,
      g = r(o),
      v = g.length
    if (d != v && !c) return !1
    for (var b = d; b--; ) {
      var w = h[b]
      if (!(c ? w in o : n.call(o, w))) return !1
    }
    var _ = f.get(i),
      C = f.get(o)
    if (_ && C) return _ == o && C == i
    var S = !0
    ;(f.set(i, o), f.set(o, i))
    for (var E = c; ++b < d; ) {
      w = h[b]
      var R = i[w],
        A = o[w]
      if (u) var T = c ? u(A, R, w, o, i, f) : u(R, A, w, i, o, f)
      if (!(T === void 0 ? R === A || l(R, A, s, u, f) : T)) {
        S = !1
        break
      }
      E || (E = w == 'constructor')
    }
    if (S && !E) {
      var I = i.constructor,
        D = o.constructor
      I != D &&
        'constructor' in i &&
        'constructor' in o &&
        !(typeof I == 'function' && I instanceof I && typeof D == 'function' && D instanceof D) &&
        (S = !1)
    }
    return (f.delete(i), f.delete(o), S)
  }
  return ((wa = a), wa)
}
var Sa, el
function dd() {
  if (el) return Sa
  el = 1
  var r = He(),
    e = ge(),
    t = r(e, 'DataView')
  return ((Sa = t), Sa)
}
var Ca, rl
function gd() {
  if (rl) return Ca
  rl = 1
  var r = He(),
    e = ge(),
    t = r(e, 'Promise')
  return ((Ca = t), Ca)
}
var Ea, tl
function vd() {
  if (tl) return Ea
  tl = 1
  var r = He(),
    e = ge(),
    t = r(e, 'Set')
  return ((Ea = t), Ea)
}
var Ra, nl
function bd() {
  if (nl) return Ra
  nl = 1
  var r = He(),
    e = ge(),
    t = r(e, 'WeakMap')
  return ((Ra = t), Ra)
}
var Oa, al
function Et() {
  if (al) return Oa
  al = 1
  var r = dd(),
    e = qo(),
    t = gd(),
    n = vd(),
    a = bd(),
    i = Fe(),
    o = lh(),
    s = '[object Map]',
    u = '[object Object]',
    l = '[object Promise]',
    f = '[object Set]',
    c = '[object WeakMap]',
    h = '[object DataView]',
    d = o(r),
    g = o(e),
    v = o(t),
    b = o(n),
    w = o(a),
    _ = i
  return (
    ((r && _(new r(new ArrayBuffer(1))) != h) ||
      (e && _(new e()) != s) ||
      (t && _(t.resolve()) != l) ||
      (n && _(new n()) != f) ||
      (a && _(new a()) != c)) &&
      (_ = function (C) {
        var S = i(C),
          E = S == u ? C.constructor : void 0,
          R = E ? o(E) : ''
        if (R)
          switch (R) {
            case d:
              return h
            case g:
              return s
            case v:
              return l
            case b:
              return f
            case w:
              return c
          }
        return S
      }),
    (Oa = _),
    Oa
  )
}
var Aa, il
function yd() {
  if (il) return Aa
  il = 1
  var r = Ct(),
    e = fh(),
    t = cd(),
    n = pd(),
    a = Et(),
    i = se(),
    o = yt(),
    s = Oo(),
    u = 1,
    l = '[object Arguments]',
    f = '[object Array]',
    c = '[object Object]',
    h = Object.prototype,
    d = h.hasOwnProperty
  function g(v, b, w, _, C, S) {
    var E = i(v),
      R = i(b),
      A = E ? f : a(v),
      T = R ? f : a(b)
    ;((A = A == l ? c : A), (T = T == l ? c : T))
    var I = A == c,
      D = T == c,
      k = A == T
    if (k && o(v)) {
      if (!o(b)) return !1
      ;((E = !0), (I = !1))
    }
    if (k && !I)
      return (S || (S = new r()), E || s(v) ? e(v, b, w, _, C, S) : t(v, b, A, w, _, C, S))
    if (!(w & u)) {
      var N = I && d.call(v, '__wrapped__'),
        j = D && d.call(b, '__wrapped__')
      if (N || j) {
        var V = N ? v.value() : v,
          B = j ? b.value() : b
        return (S || (S = new r()), C(V, B, w, _, S))
      }
    }
    return k ? (S || (S = new r()), n(v, b, w, _, C, S)) : !1
  }
  return ((Aa = g), Aa)
}
var Ta, ol
function vh() {
  if (ol) return Ta
  ol = 1
  var r = yd(),
    e = me()
  function t(n, a, i, o, s) {
    return n === a
      ? !0
      : n == null || a == null || (!e(n) && !e(a))
        ? n !== n && a !== a
        : r(n, a, i, o, t, s)
  }
  return ((Ta = t), Ta)
}
var Ma, sl
function md() {
  if (sl) return Ma
  sl = 1
  var r = Ct(),
    e = vh(),
    t = 1,
    n = 2
  function a(i, o, s, u) {
    var l = s.length,
      f = l,
      c = !u
    if (i == null) return !f
    for (i = Object(i); l--; ) {
      var h = s[l]
      if (c && h[2] ? h[1] !== i[h[0]] : !(h[0] in i)) return !1
    }
    for (; ++l < f; ) {
      h = s[l]
      var d = h[0],
        g = i[d],
        v = h[1]
      if (c && h[2]) {
        if (g === void 0 && !(d in i)) return !1
      } else {
        var b = new r()
        if (u) var w = u(g, v, d, i, o, b)
        if (!(w === void 0 ? e(v, g, t | n, u, b) : w)) return !1
      }
    }
    return !0
  }
  return ((Ma = a), Ma)
}
var Pa, ul
function bh() {
  if (ul) return Pa
  ul = 1
  var r = fe()
  function e(t) {
    return t === t && !r(t)
  }
  return ((Pa = e), Pa)
}
var qa, ll
function xd() {
  if (ll) return qa
  ll = 1
  var r = bh(),
    e = Gr()
  function t(n) {
    for (var a = e(n), i = a.length; i--; ) {
      var o = a[i],
        s = n[o]
      a[i] = [o, s, r(s)]
    }
    return a
  }
  return ((qa = t), qa)
}
var ka, fl
function yh() {
  if (fl) return ka
  fl = 1
  function r(e, t) {
    return function (n) {
      return n == null ? !1 : n[e] === t && (t !== void 0 || e in Object(n))
    }
  }
  return ((ka = r), ka)
}
var Ia, cl
function _d() {
  if (cl) return Ia
  cl = 1
  var r = md(),
    e = xd(),
    t = yh()
  function n(a) {
    var i = e(a)
    return i.length == 1 && i[0][2]
      ? t(i[0][0], i[0][1])
      : function (o) {
          return o === a || r(o, a, i)
        }
  }
  return ((Ia = n), Ia)
}
var Fa, hl
function Rt() {
  if (hl) return Fa
  hl = 1
  var r = Fe(),
    e = me(),
    t = '[object Symbol]'
  function n(a) {
    return typeof a == 'symbol' || (e(a) && r(a) == t)
  }
  return ((Fa = n), Fa)
}
var Ha, pl
function Fo() {
  if (pl) return Ha
  pl = 1
  var r = se(),
    e = Rt(),
    t = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
    n = /^\w*$/
  function a(i, o) {
    if (r(i)) return !1
    var s = typeof i
    return s == 'number' || s == 'symbol' || s == 'boolean' || i == null || e(i)
      ? !0
      : n.test(i) || !t.test(i) || (o != null && i in Object(o))
  }
  return ((Ha = a), Ha)
}
var Da, dl
function wd() {
  if (dl) return Da
  dl = 1
  var r = ko(),
    e = 'Expected a function'
  function t(n, a) {
    if (typeof n != 'function' || (a != null && typeof a != 'function')) throw new TypeError(e)
    var i = function () {
      var o = arguments,
        s = a ? a.apply(this, o) : o[0],
        u = i.cache
      if (u.has(s)) return u.get(s)
      var l = n.apply(this, o)
      return ((i.cache = u.set(s, l) || u), l)
    }
    return ((i.cache = new (t.Cache || r)()), i)
  }
  return ((t.Cache = r), (Da = t), Da)
}
var La, gl
function Sd() {
  if (gl) return La
  gl = 1
  var r = wd(),
    e = 500
  function t(n) {
    var a = r(n, function (o) {
        return (i.size === e && i.clear(), o)
      }),
      i = a.cache
    return a
  }
  return ((La = t), La)
}
var Ba, vl
function Cd() {
  if (vl) return Ba
  vl = 1
  var r = Sd(),
    e =
      /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,
    t = /\\(\\)?/g,
    n = r(function (a) {
      var i = []
      return (
        a.charCodeAt(0) === 46 && i.push(''),
        a.replace(e, function (o, s, u, l) {
          i.push(u ? l.replace(t, '$1') : s || o)
        }),
        i
      )
    })
  return ((Ba = n), Ba)
}
var ja, bl
function Ed() {
  if (bl) return ja
  bl = 1
  var r = Nr(),
    e = uh(),
    t = se(),
    n = Rt(),
    a = r ? r.prototype : void 0,
    i = a ? a.toString : void 0
  function o(s) {
    if (typeof s == 'string') return s
    if (t(s)) return e(s, o) + ''
    if (n(s)) return i ? i.call(s) : ''
    var u = s + ''
    return u == '0' && 1 / s == -1 / 0 ? '-0' : u
  }
  return ((ja = o), ja)
}
var $a, yl
function Rd() {
  if (yl) return $a
  yl = 1
  var r = Ed()
  function e(t) {
    return t == null ? '' : r(t)
  }
  return (($a = e), $a)
}
var Na, ml
function mh() {
  if (ml) return Na
  ml = 1
  var r = se(),
    e = Fo(),
    t = Cd(),
    n = Rd()
  function a(i, o) {
    return r(i) ? i : e(i, o) ? [i] : t(n(i))
  }
  return ((Na = a), Na)
}
var Ga, xl
function Ot() {
  if (xl) return Ga
  xl = 1
  var r = Rt()
  function e(t) {
    if (typeof t == 'string' || r(t)) return t
    var n = t + ''
    return n == '0' && 1 / t == -1 / 0 ? '-0' : n
  }
  return ((Ga = e), Ga)
}
var Ua, _l
function xh() {
  if (_l) return Ua
  _l = 1
  var r = mh(),
    e = Ot()
  function t(n, a) {
    a = r(a, n)
    for (var i = 0, o = a.length; n != null && i < o; ) n = n[e(a[i++])]
    return i && i == o ? n : void 0
  }
  return ((Ua = t), Ua)
}
var za, wl
function Od() {
  if (wl) return za
  wl = 1
  var r = xh()
  function e(t, n, a) {
    var i = t == null ? void 0 : r(t, n)
    return i === void 0 ? a : i
  }
  return ((za = e), za)
}
var Wa, Sl
function Ad() {
  if (Sl) return Wa
  Sl = 1
  function r(e, t) {
    return e != null && t in Object(e)
  }
  return ((Wa = r), Wa)
}
var Ka, Cl
function Td() {
  if (Cl) return Ka
  Cl = 1
  var r = mh(),
    e = wo(),
    t = se(),
    n = So(),
    a = Co(),
    i = Ot()
  function o(s, u, l) {
    u = r(u, s)
    for (var f = -1, c = u.length, h = !1; ++f < c; ) {
      var d = i(u[f])
      if (!(h = s != null && l(s, d))) break
      s = s[d]
    }
    return h || ++f != c
      ? h
      : ((c = s == null ? 0 : s.length), !!c && a(c) && n(d, c) && (t(s) || e(s)))
  }
  return ((Ka = o), Ka)
}
var Va, El
function Md() {
  if (El) return Va
  El = 1
  var r = Ad(),
    e = Td()
  function t(n, a) {
    return n != null && e(n, a, r)
  }
  return ((Va = t), Va)
}
var Xa, Rl
function Pd() {
  if (Rl) return Xa
  Rl = 1
  var r = vh(),
    e = Od(),
    t = Md(),
    n = Fo(),
    a = bh(),
    i = yh(),
    o = Ot(),
    s = 1,
    u = 2
  function l(f, c) {
    return n(f) && a(c)
      ? i(o(f), c)
      : function (h) {
          var d = e(h, f)
          return d === void 0 && d === c ? t(h, f) : r(c, d, s | u)
        }
  }
  return ((Xa = l), Xa)
}
var Ya, Ol
function qd() {
  if (Ol) return Ya
  Ol = 1
  function r(e) {
    return function (t) {
      return t?.[e]
    }
  }
  return ((Ya = r), Ya)
}
var Za, Al
function kd() {
  if (Al) return Za
  Al = 1
  var r = xh()
  function e(t) {
    return function (n) {
      return r(n, t)
    }
  }
  return ((Za = e), Za)
}
var Ja, Tl
function Id() {
  if (Tl) return Ja
  Tl = 1
  var r = qd(),
    e = kd(),
    t = Fo(),
    n = Ot()
  function a(i) {
    return t(i) ? r(n(i)) : e(i)
  }
  return ((Ja = a), Ja)
}
var Qa, Ml
function Fd() {
  if (Ml) return Qa
  Ml = 1
  var r = _d(),
    e = Pd(),
    t = mt(),
    n = se(),
    a = Id()
  function i(o) {
    return typeof o == 'function'
      ? o
      : o == null
        ? t
        : typeof o == 'object'
          ? n(o)
            ? e(o[0], o[1])
            : r(o)
          : a(o)
  }
  return ((Qa = i), Qa)
}
var ei, Pl
function Hd() {
  if (Pl) return ei
  Pl = 1
  var r = mr()
  function e(t, n) {
    return function (a, i) {
      if (a == null) return a
      if (!r(a)) return t(a, i)
      for (
        var o = a.length, s = n ? o : -1, u = Object(a);
        (n ? s-- : ++s < o) && i(u[s], s, u) !== !1;

      );
      return a
    }
  }
  return ((ei = e), ei)
}
var ri, ql
function _h() {
  if (ql) return ri
  ql = 1
  var r = ih(),
    e = Hd(),
    t = e(r)
  return ((ri = t), ri)
}
var ti, kl
function Dd() {
  if (kl) return ti
  kl = 1
  var r = _h(),
    e = mr()
  function t(n, a) {
    var i = -1,
      o = e(n) ? Array(n.length) : []
    return (
      r(n, function (s, u, l) {
        o[++i] = a(s, u, l)
      }),
      o
    )
  }
  return ((ti = t), ti)
}
var ni, Il
function Ld() {
  if (Il) return ni
  Il = 1
  var r = uh(),
    e = Fd(),
    t = Dd(),
    n = se()
  function a(i, o) {
    var s = n(i) ? r : t
    return s(i, e(o, 3))
  }
  return ((ni = a), ni)
}
var Fl
function Bd() {
  if (Fl) return Ge
  ;((Fl = 1), Object.defineProperty(Ge, '__esModule', {value: !0}), (Ge.flattenNames = void 0))
  var r = Cp(),
    e = u(r),
    t = Mo(),
    n = u(t),
    a = sh(),
    i = u(a),
    o = Ld(),
    s = u(o)
  function u(f) {
    return f && f.__esModule ? f : {default: f}
  }
  var l = (Ge.flattenNames = function f() {
    var c = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [],
      h = []
    return (
      (0, s.default)(c, function (d) {
        Array.isArray(d)
          ? f(d).map(function (g) {
              return h.push(g)
            })
          : (0, i.default)(d)
            ? (0, n.default)(d, function (g, v) {
                ;(g === !0 && h.push(v), h.push(v + '-' + g))
              })
            : (0, e.default)(d) && h.push(d)
      }),
      h
    )
  })
  return ((Ge.default = l), Ge)
}
var Ue = {},
  ai,
  Hl
function wh() {
  if (Hl) return ai
  Hl = 1
  function r(e, t) {
    for (var n = -1, a = e == null ? 0 : e.length; ++n < a && t(e[n], n, e) !== !1; );
    return e
  }
  return ((ai = r), ai)
}
var ii, Dl
function Sh() {
  if (Dl) return ii
  Dl = 1
  var r = He(),
    e = (function () {
      try {
        var t = r(Object, 'defineProperty')
        return (t({}, '', {}), t)
      } catch {}
    })()
  return ((ii = e), ii)
}
var oi, Ll
function Ho() {
  if (Ll) return oi
  Ll = 1
  var r = Sh()
  function e(t, n, a) {
    n == '__proto__' && r
      ? r(t, n, {configurable: !0, enumerable: !0, value: a, writable: !0})
      : (t[n] = a)
  }
  return ((oi = e), oi)
}
var si, Bl
function Ch() {
  if (Bl) return si
  Bl = 1
  var r = Ho(),
    e = Ur(),
    t = Object.prototype,
    n = t.hasOwnProperty
  function a(i, o, s) {
    var u = i[o]
    ;(!(n.call(i, o) && e(u, s)) || (s === void 0 && !(o in i))) && r(i, o, s)
  }
  return ((si = a), si)
}
var ui, jl
function zr() {
  if (jl) return ui
  jl = 1
  var r = Ch(),
    e = Ho()
  function t(n, a, i, o) {
    var s = !i
    i || (i = {})
    for (var u = -1, l = a.length; ++u < l; ) {
      var f = a[u],
        c = o ? o(i[f], n[f], f, i, n) : void 0
      ;(c === void 0 && (c = n[f]), s ? e(i, f, c) : r(i, f, c))
    }
    return i
  }
  return ((ui = t), ui)
}
var li, $l
function jd() {
  if ($l) return li
  $l = 1
  var r = zr(),
    e = Gr()
  function t(n, a) {
    return n && r(a, e(a), n)
  }
  return ((li = t), li)
}
var fi, Nl
function $d() {
  if (Nl) return fi
  Nl = 1
  function r(e) {
    var t = []
    if (e != null) for (var n in Object(e)) t.push(n)
    return t
  }
  return ((fi = r), fi)
}
var ci, Gl
function Nd() {
  if (Gl) return ci
  Gl = 1
  var r = fe(),
    e = Ao(),
    t = $d(),
    n = Object.prototype,
    a = n.hasOwnProperty
  function i(o) {
    if (!r(o)) return t(o)
    var s = e(o),
      u = []
    for (var l in o) (l == 'constructor' && (s || !a.call(o, l))) || u.push(l)
    return u
  }
  return ((ci = i), ci)
}
var hi, Ul
function Wr() {
  if (Ul) return hi
  Ul = 1
  var r = nh(),
    e = Nd(),
    t = mr()
  function n(a) {
    return t(a) ? r(a, !0) : e(a)
  }
  return ((hi = n), hi)
}
var pi, zl
function Gd() {
  if (zl) return pi
  zl = 1
  var r = zr(),
    e = Wr()
  function t(n, a) {
    return n && r(a, e(a), n)
  }
  return ((pi = t), pi)
}
var Pr = {exports: {}}
Pr.exports
var Wl
function Eh() {
  return (
    Wl ||
      ((Wl = 1),
      (function (r, e) {
        var t = ge(),
          n = e && !e.nodeType && e,
          a = n && !0 && r && !r.nodeType && r,
          i = a && a.exports === n,
          o = i ? t.Buffer : void 0,
          s = o ? o.allocUnsafe : void 0
        function u(l, f) {
          if (f) return l.slice()
          var c = l.length,
            h = s ? s(c) : new l.constructor(c)
          return (l.copy(h), h)
        }
        r.exports = u
      })(Pr, Pr.exports)),
    Pr.exports
  )
}
var di, Kl
function Rh() {
  if (Kl) return di
  Kl = 1
  function r(e, t) {
    var n = -1,
      a = e.length
    for (t || (t = Array(a)); ++n < a; ) t[n] = e[n]
    return t
  }
  return ((di = r), di)
}
var gi, Vl
function Ud() {
  if (Vl) return gi
  Vl = 1
  var r = zr(),
    e = Io()
  function t(n, a) {
    return r(n, e(n), a)
  }
  return ((gi = t), gi)
}
var vi, Xl
function Oh() {
  if (Xl) return vi
  Xl = 1
  var r = hh(),
    e = Po(),
    t = Io(),
    n = dh(),
    a = Object.getOwnPropertySymbols,
    i = a
      ? function (o) {
          for (var s = []; o; ) (r(s, t(o)), (o = e(o)))
          return s
        }
      : n
  return ((vi = i), vi)
}
var bi, Yl
function zd() {
  if (Yl) return bi
  Yl = 1
  var r = zr(),
    e = Oh()
  function t(n, a) {
    return r(n, e(n), a)
  }
  return ((bi = t), bi)
}
var yi, Zl
function Wd() {
  if (Zl) return yi
  Zl = 1
  var r = ph(),
    e = Oh(),
    t = Wr()
  function n(a) {
    return r(a, t, e)
  }
  return ((yi = n), yi)
}
var mi, Jl
function Kd() {
  if (Jl) return mi
  Jl = 1
  var r = Object.prototype,
    e = r.hasOwnProperty
  function t(n) {
    var a = n.length,
      i = new n.constructor(a)
    return (
      a &&
        typeof n[0] == 'string' &&
        e.call(n, 'index') &&
        ((i.index = n.index), (i.input = n.input)),
      i
    )
  }
  return ((mi = t), mi)
}
var xi, Ql
function Do() {
  if (Ql) return xi
  Ql = 1
  var r = ch()
  function e(t) {
    var n = new t.constructor(t.byteLength)
    return (new r(n).set(new r(t)), n)
  }
  return ((xi = e), xi)
}
var _i, ef
function Vd() {
  if (ef) return _i
  ef = 1
  var r = Do()
  function e(t, n) {
    var a = n ? r(t.buffer) : t.buffer
    return new t.constructor(a, t.byteOffset, t.byteLength)
  }
  return ((_i = e), _i)
}
var wi, rf
function Xd() {
  if (rf) return wi
  rf = 1
  var r = /\w*$/
  function e(t) {
    var n = new t.constructor(t.source, r.exec(t))
    return ((n.lastIndex = t.lastIndex), n)
  }
  return ((wi = e), wi)
}
var Si, tf
function Yd() {
  if (tf) return Si
  tf = 1
  var r = Nr(),
    e = r ? r.prototype : void 0,
    t = e ? e.valueOf : void 0
  function n(a) {
    return t ? Object(t.call(a)) : {}
  }
  return ((Si = n), Si)
}
var Ci, nf
function Ah() {
  if (nf) return Ci
  nf = 1
  var r = Do()
  function e(t, n) {
    var a = n ? r(t.buffer) : t.buffer
    return new t.constructor(a, t.byteOffset, t.length)
  }
  return ((Ci = e), Ci)
}
var Ei, af
function Zd() {
  if (af) return Ei
  af = 1
  var r = Do(),
    e = Vd(),
    t = Xd(),
    n = Yd(),
    a = Ah(),
    i = '[object Boolean]',
    o = '[object Date]',
    s = '[object Map]',
    u = '[object Number]',
    l = '[object RegExp]',
    f = '[object Set]',
    c = '[object String]',
    h = '[object Symbol]',
    d = '[object ArrayBuffer]',
    g = '[object DataView]',
    v = '[object Float32Array]',
    b = '[object Float64Array]',
    w = '[object Int8Array]',
    _ = '[object Int16Array]',
    C = '[object Int32Array]',
    S = '[object Uint8Array]',
    E = '[object Uint8ClampedArray]',
    R = '[object Uint16Array]',
    A = '[object Uint32Array]'
  function T(I, D, k) {
    var N = I.constructor
    switch (D) {
      case d:
        return r(I)
      case i:
      case o:
        return new N(+I)
      case g:
        return e(I, k)
      case v:
      case b:
      case w:
      case _:
      case C:
      case S:
      case E:
      case R:
      case A:
        return a(I, k)
      case s:
        return new N()
      case u:
      case c:
        return new N(I)
      case l:
        return t(I)
      case f:
        return new N()
      case h:
        return n(I)
    }
  }
  return ((Ei = T), Ei)
}
var Ri, of
function Jd() {
  if (of) return Ri
  of = 1
  var r = fe(),
    e = Object.create,
    t = (function () {
      function n() {}
      return function (a) {
        if (!r(a)) return {}
        if (e) return e(a)
        n.prototype = a
        var i = new n()
        return ((n.prototype = void 0), i)
      }
    })()
  return ((Ri = t), Ri)
}
var Oi, sf
function Th() {
  if (sf) return Oi
  sf = 1
  var r = Jd(),
    e = Po(),
    t = Ao()
  function n(a) {
    return typeof a.constructor == 'function' && !t(a) ? r(e(a)) : {}
  }
  return ((Oi = n), Oi)
}
var Ai, uf
function Qd() {
  if (uf) return Ai
  uf = 1
  var r = Et(),
    e = me(),
    t = '[object Map]'
  function n(a) {
    return e(a) && r(a) == t
  }
  return ((Ai = n), Ai)
}
var Ti, lf
function eg() {
  if (lf) return Ti
  lf = 1
  var r = Qd(),
    e = Eo(),
    t = Ro(),
    n = t && t.isMap,
    a = n ? e(n) : r
  return ((Ti = a), Ti)
}
var Mi, ff
function rg() {
  if (ff) return Mi
  ff = 1
  var r = Et(),
    e = me(),
    t = '[object Set]'
  function n(a) {
    return e(a) && r(a) == t
  }
  return ((Mi = n), Mi)
}
var Pi, cf
function tg() {
  if (cf) return Pi
  cf = 1
  var r = rg(),
    e = Eo(),
    t = Ro(),
    n = t && t.isSet,
    a = n ? e(n) : r
  return ((Pi = a), Pi)
}
var qi, hf
function ng() {
  if (hf) return qi
  hf = 1
  var r = Ct(),
    e = wh(),
    t = Ch(),
    n = jd(),
    a = Gd(),
    i = Eh(),
    o = Rh(),
    s = Ud(),
    u = zd(),
    l = gh(),
    f = Wd(),
    c = Et(),
    h = Kd(),
    d = Zd(),
    g = Th(),
    v = se(),
    b = yt(),
    w = eg(),
    _ = fe(),
    C = tg(),
    S = Gr(),
    E = Wr(),
    R = 1,
    A = 2,
    T = 4,
    I = '[object Arguments]',
    D = '[object Array]',
    k = '[object Boolean]',
    N = '[object Date]',
    j = '[object Error]',
    V = '[object Function]',
    B = '[object GeneratorFunction]',
    ce = '[object Map]',
    Z = '[object Number]',
    Xr = '[object Object]',
    Ft = '[object RegExp]',
    ne = '[object Set]',
    qe = '[object String]',
    Yr = '[object Symbol]',
    Zr = '[object WeakMap]',
    ae = '[object ArrayBuffer]',
    he = '[object DataView]',
    Ht = '[object Float32Array]',
    Dt = '[object Float64Array]',
    y = '[object Int8Array]',
    x = '[object Int16Array]',
    m = '[object Int32Array]',
    O = '[object Uint8Array]',
    q = '[object Uint8ClampedArray]',
    M = '[object Uint16Array]',
    z = '[object Uint32Array]',
    H = {}
  ;((H[I] =
    H[D] =
    H[ae] =
    H[he] =
    H[k] =
    H[N] =
    H[Ht] =
    H[Dt] =
    H[y] =
    H[x] =
    H[m] =
    H[ce] =
    H[Z] =
    H[Xr] =
    H[Ft] =
    H[ne] =
    H[qe] =
    H[Yr] =
    H[O] =
    H[q] =
    H[M] =
    H[z] =
      !0),
    (H[j] = H[V] = H[Zr] = !1))
  function W($, ue, Y, fp, Jr, Ce) {
    var ee,
      Qr = ue & R,
      et = ue & A,
      cp = ue & T
    if ((Y && (ee = Jr ? Y($, fp, Jr, Ce) : Y($)), ee !== void 0)) return ee
    if (!_($)) return $
    var hs = v($)
    if (hs) {
      if (((ee = h($)), !Qr)) return o($, ee)
    } else {
      var Ne = c($),
        ps = Ne == V || Ne == B
      if (b($)) return i($, Qr)
      if (Ne == Xr || Ne == I || (ps && !Jr)) {
        if (((ee = et || ps ? {} : g($)), !Qr)) return et ? u($, a(ee, $)) : s($, n(ee, $))
      } else {
        if (!H[Ne]) return Jr ? $ : {}
        ee = d($, Ne, Qr)
      }
    }
    Ce || (Ce = new r())
    var ds = Ce.get($)
    if (ds) return ds
    ;(Ce.set($, ee),
      C($)
        ? $.forEach(function (Ee) {
            ee.add(W(Ee, ue, Y, Ee, $, Ce))
          })
        : w($) &&
          $.forEach(function (Ee, ke) {
            ee.set(ke, W(Ee, ue, Y, ke, $, Ce))
          }))
    var hp = cp ? (et ? f : l) : et ? E : S,
      gs = hs ? void 0 : hp($)
    return (
      e(gs || $, function (Ee, ke) {
        ;(gs && ((ke = Ee), (Ee = $[ke])), t(ee, ke, W(Ee, ue, Y, ke, $, Ce)))
      }),
      ee
    )
  }
  return ((qi = W), qi)
}
var ki, pf
function ag() {
  if (pf) return ki
  pf = 1
  var r = ng(),
    e = 1,
    t = 4
  function n(a) {
    return r(a, e | t)
  }
  return ((ki = n), ki)
}
var df
function ig() {
  if (df) return Ue
  ;((df = 1), Object.defineProperty(Ue, '__esModule', {value: !0}), (Ue.mergeClasses = void 0))
  var r = Mo(),
    e = i(r),
    t = ag(),
    n = i(t),
    a =
      Object.assign ||
      function (s) {
        for (var u = 1; u < arguments.length; u++) {
          var l = arguments[u]
          for (var f in l) Object.prototype.hasOwnProperty.call(l, f) && (s[f] = l[f])
        }
        return s
      }
  function i(s) {
    return s && s.__esModule ? s : {default: s}
  }
  var o = (Ue.mergeClasses = function (u) {
    var l = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : [],
      f = (u.default && (0, n.default)(u.default)) || {}
    return (
      l.map(function (c) {
        var h = u[c]
        return (
          h &&
            (0, e.default)(h, function (d, g) {
              ;(f[g] || (f[g] = {}), (f[g] = a({}, f[g], h[g])))
            }),
          c
        )
      }),
      f
    )
  })
  return ((Ue.default = o), Ue)
}
var ze = {},
  gf
function og() {
  if (gf) return ze
  ;((gf = 1), Object.defineProperty(ze, '__esModule', {value: !0}), (ze.autoprefix = void 0))
  var r = Mo(),
    e = n(r),
    t =
      Object.assign ||
      function (o) {
        for (var s = 1; s < arguments.length; s++) {
          var u = arguments[s]
          for (var l in u) Object.prototype.hasOwnProperty.call(u, l) && (o[l] = u[l])
        }
        return o
      }
  function n(o) {
    return o && o.__esModule ? o : {default: o}
  }
  var a = {
      borderRadius: function (s) {
        return {
          msBorderRadius: s,
          MozBorderRadius: s,
          OBorderRadius: s,
          WebkitBorderRadius: s,
          borderRadius: s,
        }
      },
      boxShadow: function (s) {
        return {msBoxShadow: s, MozBoxShadow: s, OBoxShadow: s, WebkitBoxShadow: s, boxShadow: s}
      },
      userSelect: function (s) {
        return {
          WebkitTouchCallout: s,
          KhtmlUserSelect: s,
          MozUserSelect: s,
          msUserSelect: s,
          WebkitUserSelect: s,
          userSelect: s,
        }
      },
      flex: function (s) {
        return {WebkitBoxFlex: s, MozBoxFlex: s, WebkitFlex: s, msFlex: s, flex: s}
      },
      flexBasis: function (s) {
        return {WebkitFlexBasis: s, flexBasis: s}
      },
      justifyContent: function (s) {
        return {WebkitJustifyContent: s, justifyContent: s}
      },
      transition: function (s) {
        return {
          msTransition: s,
          MozTransition: s,
          OTransition: s,
          WebkitTransition: s,
          transition: s,
        }
      },
      transform: function (s) {
        return {msTransform: s, MozTransform: s, OTransform: s, WebkitTransform: s, transform: s}
      },
      absolute: function (s) {
        var u = s && s.split(' ')
        return {
          position: 'absolute',
          top: u && u[0],
          right: u && u[1],
          bottom: u && u[2],
          left: u && u[3],
        }
      },
      extend: function (s, u) {
        var l = u[s]
        return l || {extend: s}
      },
    },
    i = (ze.autoprefix = function (s) {
      var u = {}
      return (
        (0, e.default)(s, function (l, f) {
          var c = {}
          ;((0, e.default)(l, function (h, d) {
            var g = a[d]
            g ? (c = t({}, c, g(h))) : (c[d] = h)
          }),
            (u[f] = c))
        }),
        u
      )
    })
  return ((ze.default = i), ze)
}
var We = {},
  vf
function sg() {
  if (vf) return We
  ;((vf = 1), Object.defineProperty(We, '__esModule', {value: !0}), (We.hover = void 0))
  var r =
      Object.assign ||
      function (u) {
        for (var l = 1; l < arguments.length; l++) {
          var f = arguments[l]
          for (var c in f) Object.prototype.hasOwnProperty.call(f, c) && (u[c] = f[c])
        }
        return u
      },
    e = p,
    t = n(e)
  function n(u) {
    return u && u.__esModule ? u : {default: u}
  }
  function a(u, l) {
    if (!(u instanceof l)) throw new TypeError('Cannot call a class as a function')
  }
  function i(u, l) {
    if (!u) throw new ReferenceError("this hasn't been initialised - super() hasn't been called")
    return l && (typeof l == 'object' || typeof l == 'function') ? l : u
  }
  function o(u, l) {
    if (typeof l != 'function' && l !== null)
      throw new TypeError('Super expression must either be null or a function, not ' + typeof l)
    ;((u.prototype = Object.create(l && l.prototype, {
      constructor: {value: u, enumerable: !1, writable: !0, configurable: !0},
    })),
      l && (Object.setPrototypeOf ? Object.setPrototypeOf(u, l) : (u.__proto__ = l)))
  }
  var s = (We.hover = function (l) {
    var f = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 'span'
    return (function (c) {
      o(h, c)
      function h() {
        var d, g, v, b
        a(this, h)
        for (var w = arguments.length, _ = Array(w), C = 0; C < w; C++) _[C] = arguments[C]
        return (
          (b =
            ((g =
              ((v = i(
                this,
                (d = h.__proto__ || Object.getPrototypeOf(h)).call.apply(d, [this].concat(_)),
              )),
              v)),
            (v.state = {hover: !1}),
            (v.handleMouseOver = function () {
              return v.setState({hover: !0})
            }),
            (v.handleMouseOut = function () {
              return v.setState({hover: !1})
            }),
            (v.render = function () {
              return t.default.createElement(
                f,
                {onMouseOver: v.handleMouseOver, onMouseOut: v.handleMouseOut},
                t.default.createElement(l, r({}, v.props, v.state)),
              )
            }),
            g)),
          i(v, b)
        )
      }
      return h
    })(t.default.Component)
  })
  return ((We.default = s), We)
}
var Ke = {},
  bf
function ug() {
  if (bf) return Ke
  ;((bf = 1), Object.defineProperty(Ke, '__esModule', {value: !0}), (Ke.active = void 0))
  var r =
      Object.assign ||
      function (u) {
        for (var l = 1; l < arguments.length; l++) {
          var f = arguments[l]
          for (var c in f) Object.prototype.hasOwnProperty.call(f, c) && (u[c] = f[c])
        }
        return u
      },
    e = p,
    t = n(e)
  function n(u) {
    return u && u.__esModule ? u : {default: u}
  }
  function a(u, l) {
    if (!(u instanceof l)) throw new TypeError('Cannot call a class as a function')
  }
  function i(u, l) {
    if (!u) throw new ReferenceError("this hasn't been initialised - super() hasn't been called")
    return l && (typeof l == 'object' || typeof l == 'function') ? l : u
  }
  function o(u, l) {
    if (typeof l != 'function' && l !== null)
      throw new TypeError('Super expression must either be null or a function, not ' + typeof l)
    ;((u.prototype = Object.create(l && l.prototype, {
      constructor: {value: u, enumerable: !1, writable: !0, configurable: !0},
    })),
      l && (Object.setPrototypeOf ? Object.setPrototypeOf(u, l) : (u.__proto__ = l)))
  }
  var s = (Ke.active = function (l) {
    var f = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 'span'
    return (function (c) {
      o(h, c)
      function h() {
        var d, g, v, b
        a(this, h)
        for (var w = arguments.length, _ = Array(w), C = 0; C < w; C++) _[C] = arguments[C]
        return (
          (b =
            ((g =
              ((v = i(
                this,
                (d = h.__proto__ || Object.getPrototypeOf(h)).call.apply(d, [this].concat(_)),
              )),
              v)),
            (v.state = {active: !1}),
            (v.handleMouseDown = function () {
              return v.setState({active: !0})
            }),
            (v.handleMouseUp = function () {
              return v.setState({active: !1})
            }),
            (v.render = function () {
              return t.default.createElement(
                f,
                {onMouseDown: v.handleMouseDown, onMouseUp: v.handleMouseUp},
                t.default.createElement(l, r({}, v.props, v.state)),
              )
            }),
            g)),
          i(v, b)
        )
      }
      return h
    })(t.default.Component)
  })
  return ((Ke.default = s), Ke)
}
var tt = {},
  yf
function lg() {
  if (yf) return tt
  ;((yf = 1), Object.defineProperty(tt, '__esModule', {value: !0}))
  var r = function (t, n) {
    var a = {},
      i = function (s) {
        var u = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0
        a[s] = u
      }
    return (
      t === 0 && i('first-child'),
      t === n - 1 && i('last-child'),
      (t === 0 || t % 2 === 0) && i('even'),
      Math.abs(t % 2) === 1 && i('odd'),
      i('nth-child', t),
      a
    )
  }
  return ((tt.default = r), tt)
}
var mf
function Me() {
  if (mf) return re
  ;((mf = 1),
    Object.defineProperty(re, '__esModule', {value: !0}),
    (re.ReactCSS = re.loop = re.handleActive = re.handleHover = re.hover = void 0))
  var r = Bd(),
    e = h(r),
    t = ig(),
    n = h(t),
    a = og(),
    i = h(a),
    o = sg(),
    s = h(o),
    u = ug(),
    l = h(u),
    f = lg(),
    c = h(f)
  function h(g) {
    return g && g.__esModule ? g : {default: g}
  }
  ;((re.hover = s.default),
    (re.handleHover = s.default),
    (re.handleActive = l.default),
    (re.loop = c.default))
  var d = (re.ReactCSS = function (v) {
    for (var b = arguments.length, w = Array(b > 1 ? b - 1 : 0), _ = 1; _ < b; _++)
      w[_ - 1] = arguments[_]
    var C = (0, e.default)(w),
      S = (0, n.default)(v, C)
    return (0, i.default)(S)
  })
  return ((re.default = d), re)
}
var Lo = Me()
const L = bt(Lo)
var fg = function (e, t, n, a, i) {
    var o = i.clientWidth,
      s = i.clientHeight,
      u = typeof e.pageX == 'number' ? e.pageX : e.touches[0].pageX,
      l = typeof e.pageY == 'number' ? e.pageY : e.touches[0].pageY,
      f = u - (i.getBoundingClientRect().left + window.pageXOffset),
      c = l - (i.getBoundingClientRect().top + window.pageYOffset)
    if (n === 'vertical') {
      var h = void 0
      if ((c < 0 ? (h = 0) : c > s ? (h = 1) : (h = Math.round((c * 100) / s) / 100), t.a !== h))
        return {h: t.h, s: t.s, l: t.l, a: h, source: 'rgb'}
    } else {
      var d = void 0
      if ((f < 0 ? (d = 0) : f > o ? (d = 1) : (d = Math.round((f * 100) / o) / 100), a !== d))
        return {h: t.h, s: t.s, l: t.l, a: d, source: 'rgb'}
    }
    return null
  },
  Ii = {},
  cg = function (e, t, n, a) {
    if (typeof document > 'u' && !a) return null
    var i = a ? new a() : document.createElement('canvas')
    ;((i.width = n * 2), (i.height = n * 2))
    var o = i.getContext('2d')
    return o
      ? ((o.fillStyle = e),
        o.fillRect(0, 0, i.width, i.height),
        (o.fillStyle = t),
        o.fillRect(0, 0, n, n),
        o.translate(n, n),
        o.fillRect(0, 0, n, n),
        i.toDataURL())
      : null
  },
  hg = function (e, t, n, a) {
    var i = e + '-' + t + '-' + n + (a ? '-server' : '')
    if (Ii[i]) return Ii[i]
    var o = cg(e, t, n, a)
    return ((Ii[i] = o), o)
  },
  xf =
    Object.assign ||
    function (r) {
      for (var e = 1; e < arguments.length; e++) {
        var t = arguments[e]
        for (var n in t) Object.prototype.hasOwnProperty.call(t, n) && (r[n] = t[n])
      }
      return r
    },
  xr = function (e) {
    var t = e.white,
      n = e.grey,
      a = e.size,
      i = e.renderers,
      o = e.borderRadius,
      s = e.boxShadow,
      u = e.children,
      l = L({
        default: {
          grid: {
            borderRadius: o,
            boxShadow: s,
            absolute: '0px 0px 0px 0px',
            background: 'url(' + hg(t, n, a, i.canvas) + ') center left',
          },
        },
      })
    return bp(u)
      ? p.cloneElement(u, xf({}, u.props, {style: xf({}, u.props.style, l.grid)}))
      : p.createElement('div', {style: l.grid})
  }
xr.defaultProps = {size: 8, white: 'transparent', grey: 'rgba(0,0,0,.08)', renderers: {}}
var pg =
    Object.assign ||
    function (r) {
      for (var e = 1; e < arguments.length; e++) {
        var t = arguments[e]
        for (var n in t) Object.prototype.hasOwnProperty.call(t, n) && (r[n] = t[n])
      }
      return r
    },
  dg = (function () {
    function r(e, t) {
      for (var n = 0; n < t.length; n++) {
        var a = t[n]
        ;((a.enumerable = a.enumerable || !1),
          (a.configurable = !0),
          'value' in a && (a.writable = !0),
          Object.defineProperty(e, a.key, a))
      }
    }
    return function (e, t, n) {
      return (t && r(e.prototype, t), n && r(e, n), e)
    }
  })()
function gg(r, e) {
  if (!(r instanceof e)) throw new TypeError('Cannot call a class as a function')
}
function _f(r, e) {
  if (!r) throw new ReferenceError("this hasn't been initialised - super() hasn't been called")
  return e && (typeof e == 'object' || typeof e == 'function') ? e : r
}
function vg(r, e) {
  if (typeof e != 'function' && e !== null)
    throw new TypeError('Super expression must either be null or a function, not ' + typeof e)
  ;((r.prototype = Object.create(e && e.prototype, {
    constructor: {value: r, enumerable: !1, writable: !0, configurable: !0},
  })),
    e && (Object.setPrototypeOf ? Object.setPrototypeOf(r, e) : (r.__proto__ = e)))
}
var Bo = (function (r) {
    vg(e, r)
    function e() {
      var t, n, a, i
      gg(this, e)
      for (var o = arguments.length, s = Array(o), u = 0; u < o; u++) s[u] = arguments[u]
      return (
        (i =
          ((n =
            ((a = _f(
              this,
              (t = e.__proto__ || Object.getPrototypeOf(e)).call.apply(t, [this].concat(s)),
            )),
            a)),
          (a.handleChange = function (l) {
            var f = fg(l, a.props.hsl, a.props.direction, a.props.a, a.container)
            f && typeof a.props.onChange == 'function' && a.props.onChange(f, l)
          }),
          (a.handleMouseDown = function (l) {
            ;(a.handleChange(l),
              window.addEventListener('mousemove', a.handleChange),
              window.addEventListener('mouseup', a.handleMouseUp))
          }),
          (a.handleMouseUp = function () {
            a.unbindEventListeners()
          }),
          (a.unbindEventListeners = function () {
            ;(window.removeEventListener('mousemove', a.handleChange),
              window.removeEventListener('mouseup', a.handleMouseUp))
          }),
          n)),
        _f(a, i)
      )
    }
    return (
      dg(e, [
        {
          key: 'componentWillUnmount',
          value: function () {
            this.unbindEventListeners()
          },
        },
        {
          key: 'render',
          value: function () {
            var n = this,
              a = this.props.rgb,
              i = L(
                {
                  default: {
                    alpha: {absolute: '0px 0px 0px 0px', borderRadius: this.props.radius},
                    checkboard: {
                      absolute: '0px 0px 0px 0px',
                      overflow: 'hidden',
                      borderRadius: this.props.radius,
                    },
                    gradient: {
                      absolute: '0px 0px 0px 0px',
                      background:
                        'linear-gradient(to right, rgba(' +
                        a.r +
                        ',' +
                        a.g +
                        ',' +
                        a.b +
                        `, 0) 0%,
           rgba(` +
                        a.r +
                        ',' +
                        a.g +
                        ',' +
                        a.b +
                        ', 1) 100%)',
                      boxShadow: this.props.shadow,
                      borderRadius: this.props.radius,
                    },
                    container: {position: 'relative', height: '100%', margin: '0 3px'},
                    pointer: {position: 'absolute', left: a.a * 100 + '%'},
                    slider: {
                      width: '4px',
                      borderRadius: '1px',
                      height: '8px',
                      boxShadow: '0 0 2px rgba(0, 0, 0, .6)',
                      background: '#fff',
                      marginTop: '1px',
                      transform: 'translateX(-2px)',
                    },
                  },
                  vertical: {
                    gradient: {
                      background:
                        'linear-gradient(to bottom, rgba(' +
                        a.r +
                        ',' +
                        a.g +
                        ',' +
                        a.b +
                        `, 0) 0%,
           rgba(` +
                        a.r +
                        ',' +
                        a.g +
                        ',' +
                        a.b +
                        ', 1) 100%)',
                    },
                    pointer: {left: 0, top: a.a * 100 + '%'},
                  },
                  overwrite: pg({}, this.props.style),
                },
                {vertical: this.props.direction === 'vertical', overwrite: !0},
              )
            return p.createElement(
              'div',
              {style: i.alpha},
              p.createElement(
                'div',
                {style: i.checkboard},
                p.createElement(xr, {renderers: this.props.renderers}),
              ),
              p.createElement('div', {style: i.gradient}),
              p.createElement(
                'div',
                {
                  style: i.container,
                  ref: function (s) {
                    return (n.container = s)
                  },
                  onMouseDown: this.handleMouseDown,
                  onTouchMove: this.handleChange,
                  onTouchStart: this.handleChange,
                },
                p.createElement(
                  'div',
                  {style: i.pointer},
                  this.props.pointer
                    ? p.createElement(this.props.pointer, this.props)
                    : p.createElement('div', {style: i.slider}),
                ),
              ),
            )
          },
        },
      ]),
      e
    )
  })(Br || jr),
  bg = (function () {
    function r(e, t) {
      for (var n = 0; n < t.length; n++) {
        var a = t[n]
        ;((a.enumerable = a.enumerable || !1),
          (a.configurable = !0),
          'value' in a && (a.writable = !0),
          Object.defineProperty(e, a.key, a))
      }
    }
    return function (e, t, n) {
      return (t && r(e.prototype, t), n && r(e, n), e)
    }
  })()
function yg(r, e, t) {
  return (
    e in r
      ? Object.defineProperty(r, e, {value: t, enumerable: !0, configurable: !0, writable: !0})
      : (r[e] = t),
    r
  )
}
function mg(r, e) {
  if (!(r instanceof e)) throw new TypeError('Cannot call a class as a function')
}
function xg(r, e) {
  if (!r) throw new ReferenceError("this hasn't been initialised - super() hasn't been called")
  return e && (typeof e == 'object' || typeof e == 'function') ? e : r
}
function _g(r, e) {
  if (typeof e != 'function' && e !== null)
    throw new TypeError('Super expression must either be null or a function, not ' + typeof e)
  ;((r.prototype = Object.create(e && e.prototype, {
    constructor: {value: r, enumerable: !1, writable: !0, configurable: !0},
  })),
    e && (Object.setPrototypeOf ? Object.setPrototypeOf(r, e) : (r.__proto__ = e)))
}
var wg = 1,
  Mh = 38,
  Sg = 40,
  Cg = [Mh, Sg],
  Eg = function (e) {
    return Cg.indexOf(e) > -1
  },
  Rg = function (e) {
    return Number(String(e).replace(/%/g, ''))
  },
  Og = 1,
  U = (function (r) {
    _g(e, r)
    function e(t) {
      mg(this, e)
      var n = xg(this, (e.__proto__ || Object.getPrototypeOf(e)).call(this))
      return (
        (n.handleBlur = function () {
          n.state.blurValue && n.setState({value: n.state.blurValue, blurValue: null})
        }),
        (n.handleChange = function (a) {
          n.setUpdatedValue(a.target.value, a)
        }),
        (n.handleKeyDown = function (a) {
          var i = Rg(a.target.value)
          if (!isNaN(i) && Eg(a.keyCode)) {
            var o = n.getArrowOffset(),
              s = a.keyCode === Mh ? i + o : i - o
            n.setUpdatedValue(s, a)
          }
        }),
        (n.handleDrag = function (a) {
          if (n.props.dragLabel) {
            var i = Math.round(n.props.value + a.movementX)
            i >= 0 &&
              i <= n.props.dragMax &&
              n.props.onChange &&
              n.props.onChange(n.getValueObjectWithLabel(i), a)
          }
        }),
        (n.handleMouseDown = function (a) {
          n.props.dragLabel &&
            (a.preventDefault(),
            n.handleDrag(a),
            window.addEventListener('mousemove', n.handleDrag),
            window.addEventListener('mouseup', n.handleMouseUp))
        }),
        (n.handleMouseUp = function () {
          n.unbindEventListeners()
        }),
        (n.unbindEventListeners = function () {
          ;(window.removeEventListener('mousemove', n.handleDrag),
            window.removeEventListener('mouseup', n.handleMouseUp))
        }),
        (n.state = {
          value: String(t.value).toUpperCase(),
          blurValue: String(t.value).toUpperCase(),
        }),
        (n.inputId = 'rc-editable-input-' + Og++),
        n
      )
    }
    return (
      bg(e, [
        {
          key: 'componentDidUpdate',
          value: function (n, a) {
            this.props.value !== this.state.value &&
              (n.value !== this.props.value || a.value !== this.state.value) &&
              (this.input === document.activeElement
                ? this.setState({blurValue: String(this.props.value).toUpperCase()})
                : this.setState({
                    value: String(this.props.value).toUpperCase(),
                    blurValue: !this.state.blurValue && String(this.props.value).toUpperCase(),
                  }))
          },
        },
        {
          key: 'componentWillUnmount',
          value: function () {
            this.unbindEventListeners()
          },
        },
        {
          key: 'getValueObjectWithLabel',
          value: function (n) {
            return yg({}, this.props.label, n)
          },
        },
        {
          key: 'getArrowOffset',
          value: function () {
            return this.props.arrowOffset || wg
          },
        },
        {
          key: 'setUpdatedValue',
          value: function (n, a) {
            var i = this.props.label ? this.getValueObjectWithLabel(n) : n
            ;(this.props.onChange && this.props.onChange(i, a), this.setState({value: n}))
          },
        },
        {
          key: 'render',
          value: function () {
            var n = this,
              a = L(
                {
                  default: {wrap: {position: 'relative'}},
                  'user-override': {
                    wrap: this.props.style && this.props.style.wrap ? this.props.style.wrap : {},
                    input: this.props.style && this.props.style.input ? this.props.style.input : {},
                    label: this.props.style && this.props.style.label ? this.props.style.label : {},
                  },
                  'dragLabel-true': {label: {cursor: 'ew-resize'}},
                },
                {'user-override': !0},
                this.props,
              )
            return p.createElement(
              'div',
              {style: a.wrap},
              p.createElement('input', {
                id: this.inputId,
                style: a.input,
                ref: function (o) {
                  return (n.input = o)
                },
                value: this.state.value,
                onKeyDown: this.handleKeyDown,
                onChange: this.handleChange,
                onBlur: this.handleBlur,
                placeholder: this.props.placeholder,
                spellCheck: 'false',
              }),
              this.props.label && !this.props.hideLabel
                ? p.createElement(
                    'label',
                    {htmlFor: this.inputId, style: a.label, onMouseDown: this.handleMouseDown},
                    this.props.label,
                  )
                : null,
            )
          },
        },
      ]),
      e
    )
  })(Br || jr),
  Ag = function (e, t, n, a) {
    var i = a.clientWidth,
      o = a.clientHeight,
      s = typeof e.pageX == 'number' ? e.pageX : e.touches[0].pageX,
      u = typeof e.pageY == 'number' ? e.pageY : e.touches[0].pageY,
      l = s - (a.getBoundingClientRect().left + window.pageXOffset),
      f = u - (a.getBoundingClientRect().top + window.pageYOffset)
    if (t === 'vertical') {
      var c = void 0
      if (f < 0) c = 359
      else if (f > o) c = 0
      else {
        var h = -((f * 100) / o) + 100
        c = (360 * h) / 100
      }
      if (n.h !== c) return {h: c, s: n.s, l: n.l, a: n.a, source: 'hsl'}
    } else {
      var d = void 0
      if (l < 0) d = 0
      else if (l > i) d = 359
      else {
        var g = (l * 100) / i
        d = (360 * g) / 100
      }
      if (n.h !== d) return {h: d, s: n.s, l: n.l, a: n.a, source: 'hsl'}
    }
    return null
  },
  Tg = (function () {
    function r(e, t) {
      for (var n = 0; n < t.length; n++) {
        var a = t[n]
        ;((a.enumerable = a.enumerable || !1),
          (a.configurable = !0),
          'value' in a && (a.writable = !0),
          Object.defineProperty(e, a.key, a))
      }
    }
    return function (e, t, n) {
      return (t && r(e.prototype, t), n && r(e, n), e)
    }
  })()
function Mg(r, e) {
  if (!(r instanceof e)) throw new TypeError('Cannot call a class as a function')
}
function wf(r, e) {
  if (!r) throw new ReferenceError("this hasn't been initialised - super() hasn't been called")
  return e && (typeof e == 'object' || typeof e == 'function') ? e : r
}
function Pg(r, e) {
  if (typeof e != 'function' && e !== null)
    throw new TypeError('Super expression must either be null or a function, not ' + typeof e)
  ;((r.prototype = Object.create(e && e.prototype, {
    constructor: {value: r, enumerable: !1, writable: !0, configurable: !0},
  })),
    e && (Object.setPrototypeOf ? Object.setPrototypeOf(r, e) : (r.__proto__ = e)))
}
var _r = (function (r) {
    Pg(e, r)
    function e() {
      var t, n, a, i
      Mg(this, e)
      for (var o = arguments.length, s = Array(o), u = 0; u < o; u++) s[u] = arguments[u]
      return (
        (i =
          ((n =
            ((a = wf(
              this,
              (t = e.__proto__ || Object.getPrototypeOf(e)).call.apply(t, [this].concat(s)),
            )),
            a)),
          (a.handleChange = function (l) {
            var f = Ag(l, a.props.direction, a.props.hsl, a.container)
            f && typeof a.props.onChange == 'function' && a.props.onChange(f, l)
          }),
          (a.handleMouseDown = function (l) {
            ;(a.handleChange(l),
              window.addEventListener('mousemove', a.handleChange),
              window.addEventListener('mouseup', a.handleMouseUp))
          }),
          (a.handleMouseUp = function () {
            a.unbindEventListeners()
          }),
          n)),
        wf(a, i)
      )
    }
    return (
      Tg(e, [
        {
          key: 'componentWillUnmount',
          value: function () {
            this.unbindEventListeners()
          },
        },
        {
          key: 'unbindEventListeners',
          value: function () {
            ;(window.removeEventListener('mousemove', this.handleChange),
              window.removeEventListener('mouseup', this.handleMouseUp))
          },
        },
        {
          key: 'render',
          value: function () {
            var n = this,
              a = this.props.direction,
              i = a === void 0 ? 'horizontal' : a,
              o = L(
                {
                  default: {
                    hue: {
                      absolute: '0px 0px 0px 0px',
                      borderRadius: this.props.radius,
                      boxShadow: this.props.shadow,
                    },
                    container: {
                      padding: '0 2px',
                      position: 'relative',
                      height: '100%',
                      borderRadius: this.props.radius,
                    },
                    pointer: {position: 'absolute', left: (this.props.hsl.h * 100) / 360 + '%'},
                    slider: {
                      marginTop: '1px',
                      width: '4px',
                      borderRadius: '1px',
                      height: '8px',
                      boxShadow: '0 0 2px rgba(0, 0, 0, .6)',
                      background: '#fff',
                      transform: 'translateX(-2px)',
                    },
                  },
                  vertical: {
                    pointer: {left: '0px', top: -((this.props.hsl.h * 100) / 360) + 100 + '%'},
                  },
                },
                {vertical: i === 'vertical'},
              )
            return p.createElement(
              'div',
              {style: o.hue},
              p.createElement(
                'div',
                {
                  className: 'hue-' + i,
                  style: o.container,
                  ref: function (u) {
                    return (n.container = u)
                  },
                  onMouseDown: this.handleMouseDown,
                  onTouchMove: this.handleChange,
                  onTouchStart: this.handleChange,
                },
                p.createElement(
                  'style',
                  null,
                  `
            .hue-horizontal {
              background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0
                33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
              background: -webkit-linear-gradient(to right, #f00 0%, #ff0
                17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
            }

            .hue-vertical {
              background: linear-gradient(to top, #f00 0%, #ff0 17%, #0f0 33%,
                #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
              background: -webkit-linear-gradient(to top, #f00 0%, #ff0 17%,
                #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
            }
          `,
                ),
                p.createElement(
                  'div',
                  {style: o.pointer},
                  this.props.pointer
                    ? p.createElement(this.props.pointer, this.props)
                    : p.createElement('div', {style: o.slider}),
                ),
              ),
            )
          },
        },
      ]),
      e
    )
  })(Br || jr),
  Fi = {exports: {}},
  Hi,
  Sf
function qg() {
  if (Sf) return Hi
  Sf = 1
  var r = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED'
  return ((Hi = r), Hi)
}
var Di, Cf
function kg() {
  if (Cf) return Di
  Cf = 1
  var r = qg()
  function e() {}
  function t() {}
  return (
    (t.resetWarningCache = e),
    (Di = function () {
      function n(o, s, u, l, f, c) {
        if (c !== r) {
          var h = new Error(
            'Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types',
          )
          throw ((h.name = 'Invariant Violation'), h)
        }
      }
      n.isRequired = n
      function a() {
        return n
      }
      var i = {
        array: n,
        bigint: n,
        bool: n,
        func: n,
        number: n,
        object: n,
        string: n,
        symbol: n,
        any: n,
        arrayOf: a,
        element: n,
        elementType: n,
        instanceOf: a,
        node: n,
        objectOf: a,
        oneOf: a,
        oneOfType: a,
        shape: a,
        exact: a,
        checkPropTypes: t,
        resetWarningCache: e,
      }
      return ((i.PropTypes = i), i)
    }),
    Di
  )
}
var Ef
function Ph() {
  return (Ef || ((Ef = 1), (Fi.exports = kg()())), Fi.exports)
}
var Ig = Ph()
const P = bt(Ig)
function Fg() {
  ;((this.__data__ = []), (this.size = 0))
}
function Kr(r, e) {
  return r === e || (r !== r && e !== e)
}
function At(r, e) {
  for (var t = r.length; t--; ) if (Kr(r[t][0], e)) return t
  return -1
}
var Hg = Array.prototype,
  Dg = Hg.splice
function Lg(r) {
  var e = this.__data__,
    t = At(e, r)
  if (t < 0) return !1
  var n = e.length - 1
  return (t == n ? e.pop() : Dg.call(e, t, 1), --this.size, !0)
}
function Bg(r) {
  var e = this.__data__,
    t = At(e, r)
  return t < 0 ? void 0 : e[t][1]
}
function jg(r) {
  return At(this.__data__, r) > -1
}
function $g(r, e) {
  var t = this.__data__,
    n = At(t, r)
  return (n < 0 ? (++this.size, t.push([r, e])) : (t[n][1] = e), this)
}
function we(r) {
  var e = -1,
    t = r == null ? 0 : r.length
  for (this.clear(); ++e < t; ) {
    var n = r[e]
    this.set(n[0], n[1])
  }
}
we.prototype.clear = Fg
we.prototype.delete = Lg
we.prototype.get = Bg
we.prototype.has = jg
we.prototype.set = $g
function Ng() {
  ;((this.__data__ = new we()), (this.size = 0))
}
function Gg(r) {
  var e = this.__data__,
    t = e.delete(r)
  return ((this.size = e.size), t)
}
function Ug(r) {
  return this.__data__.get(r)
}
function zg(r) {
  return this.__data__.has(r)
}
var qh = typeof global == 'object' && global && global.Object === Object && global,
  Wg = typeof self == 'object' && self && self.Object === Object && self,
  ve = qh || Wg || Function('return this')(),
  Ae = ve.Symbol,
  kh = Object.prototype,
  Kg = kh.hasOwnProperty,
  Vg = kh.toString,
  Cr = Ae ? Ae.toStringTag : void 0
function Xg(r) {
  var e = Kg.call(r, Cr),
    t = r[Cr]
  try {
    r[Cr] = void 0
    var n = !0
  } catch {}
  var a = Vg.call(r)
  return (n && (e ? (r[Cr] = t) : delete r[Cr]), a)
}
var Yg = Object.prototype,
  Zg = Yg.toString
function Jg(r) {
  return Zg.call(r)
}
var Qg = '[object Null]',
  e0 = '[object Undefined]',
  Rf = Ae ? Ae.toStringTag : void 0
function De(r) {
  return r == null ? (r === void 0 ? e0 : Qg) : Rf && Rf in Object(r) ? Xg(r) : Jg(r)
}
function le(r) {
  var e = typeof r
  return r != null && (e == 'object' || e == 'function')
}
var r0 = '[object AsyncFunction]',
  t0 = '[object Function]',
  n0 = '[object GeneratorFunction]',
  a0 = '[object Proxy]'
function jo(r) {
  if (!le(r)) return !1
  var e = De(r)
  return e == t0 || e == n0 || e == r0 || e == a0
}
var Li = ve['__core-js_shared__'],
  Of = (function () {
    var r = /[^.]+$/.exec((Li && Li.keys && Li.keys.IE_PROTO) || '')
    return r ? 'Symbol(src)_1.' + r : ''
  })()
function i0(r) {
  return !!Of && Of in r
}
var o0 = Function.prototype,
  s0 = o0.toString
function Le(r) {
  if (r != null) {
    try {
      return s0.call(r)
    } catch {}
    try {
      return r + ''
    } catch {}
  }
  return ''
}
var u0 = /[\\^$.*+?()[\]{}|]/g,
  l0 = /^\[object .+?Constructor\]$/,
  f0 = Function.prototype,
  c0 = Object.prototype,
  h0 = f0.toString,
  p0 = c0.hasOwnProperty,
  d0 = RegExp(
    '^' +
      h0
        .call(p0)
        .replace(u0, '\\$&')
        .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') +
      '$',
  )
function g0(r) {
  if (!le(r) || i0(r)) return !1
  var e = jo(r) ? d0 : l0
  return e.test(Le(r))
}
function v0(r, e) {
  return r?.[e]
}
function Be(r, e) {
  var t = v0(r, e)
  return g0(t) ? t : void 0
}
var Dr = Be(ve, 'Map'),
  Lr = Be(Object, 'create')
function b0() {
  ;((this.__data__ = Lr ? Lr(null) : {}), (this.size = 0))
}
function y0(r) {
  var e = this.has(r) && delete this.__data__[r]
  return ((this.size -= e ? 1 : 0), e)
}
var m0 = '__lodash_hash_undefined__',
  x0 = Object.prototype,
  _0 = x0.hasOwnProperty
function w0(r) {
  var e = this.__data__
  if (Lr) {
    var t = e[r]
    return t === m0 ? void 0 : t
  }
  return _0.call(e, r) ? e[r] : void 0
}
var S0 = Object.prototype,
  C0 = S0.hasOwnProperty
function E0(r) {
  var e = this.__data__
  return Lr ? e[r] !== void 0 : C0.call(e, r)
}
var R0 = '__lodash_hash_undefined__'
function O0(r, e) {
  var t = this.__data__
  return ((this.size += this.has(r) ? 0 : 1), (t[r] = Lr && e === void 0 ? R0 : e), this)
}
function Ie(r) {
  var e = -1,
    t = r == null ? 0 : r.length
  for (this.clear(); ++e < t; ) {
    var n = r[e]
    this.set(n[0], n[1])
  }
}
Ie.prototype.clear = b0
Ie.prototype.delete = y0
Ie.prototype.get = w0
Ie.prototype.has = E0
Ie.prototype.set = O0
function A0() {
  ;((this.size = 0), (this.__data__ = {hash: new Ie(), map: new (Dr || we)(), string: new Ie()}))
}
function T0(r) {
  var e = typeof r
  return e == 'string' || e == 'number' || e == 'symbol' || e == 'boolean'
    ? r !== '__proto__'
    : r === null
}
function Tt(r, e) {
  var t = r.__data__
  return T0(e) ? t[typeof e == 'string' ? 'string' : 'hash'] : t.map
}
function M0(r) {
  var e = Tt(this, r).delete(r)
  return ((this.size -= e ? 1 : 0), e)
}
function P0(r) {
  return Tt(this, r).get(r)
}
function q0(r) {
  return Tt(this, r).has(r)
}
function k0(r, e) {
  var t = Tt(this, r),
    n = t.size
  return (t.set(r, e), (this.size += t.size == n ? 0 : 1), this)
}
function Se(r) {
  var e = -1,
    t = r == null ? 0 : r.length
  for (this.clear(); ++e < t; ) {
    var n = r[e]
    this.set(n[0], n[1])
  }
}
Se.prototype.clear = A0
Se.prototype.delete = M0
Se.prototype.get = P0
Se.prototype.has = q0
Se.prototype.set = k0
var I0 = 200
function F0(r, e) {
  var t = this.__data__
  if (t instanceof we) {
    var n = t.__data__
    if (!Dr || n.length < I0 - 1) return (n.push([r, e]), (this.size = ++t.size), this)
    t = this.__data__ = new Se(n)
  }
  return (t.set(r, e), (this.size = t.size), this)
}
function ye(r) {
  var e = (this.__data__ = new we(r))
  this.size = e.size
}
ye.prototype.clear = Ng
ye.prototype.delete = Gg
ye.prototype.get = Ug
ye.prototype.has = zg
ye.prototype.set = F0
var ft = (function () {
  try {
    var r = Be(Object, 'defineProperty')
    return (r({}, '', {}), r)
  } catch {}
})()
function $o(r, e, t) {
  e == '__proto__' && ft
    ? ft(r, e, {configurable: !0, enumerable: !0, value: t, writable: !0})
    : (r[e] = t)
}
function go(r, e, t) {
  ;((t !== void 0 && !Kr(r[e], t)) || (t === void 0 && !(e in r))) && $o(r, e, t)
}
function H0(r) {
  return function (e, t, n) {
    for (var a = -1, i = Object(e), o = n(e), s = o.length; s--; ) {
      var u = o[++a]
      if (t(i[u], u, i) === !1) break
    }
    return e
  }
}
var Ih = H0(),
  Fh = typeof exports == 'object' && exports && !exports.nodeType && exports,
  Af = Fh && typeof module == 'object' && module && !module.nodeType && module,
  D0 = Af && Af.exports === Fh,
  Tf = D0 ? ve.Buffer : void 0
Tf && Tf.allocUnsafe
function L0(r, e) {
  return r.slice()
}
var ct = ve.Uint8Array
function B0(r) {
  var e = new r.constructor(r.byteLength)
  return (new ct(e).set(new ct(r)), e)
}
function j0(r, e) {
  var t = B0(r.buffer)
  return new r.constructor(t, r.byteOffset, r.length)
}
function $0(r, e) {
  var t = -1,
    n = r.length
  for (e || (e = Array(n)); ++t < n; ) e[t] = r[t]
  return e
}
var Mf = Object.create,
  N0 = (function () {
    function r() {}
    return function (e) {
      if (!le(e)) return {}
      if (Mf) return Mf(e)
      r.prototype = e
      var t = new r()
      return ((r.prototype = void 0), t)
    }
  })()
function Hh(r, e) {
  return function (t) {
    return r(e(t))
  }
}
var Dh = Hh(Object.getPrototypeOf, Object),
  G0 = Object.prototype
function No(r) {
  var e = r && r.constructor,
    t = (typeof e == 'function' && e.prototype) || G0
  return r === t
}
function U0(r) {
  return typeof r.constructor == 'function' && !No(r) ? N0(Dh(r)) : {}
}
function Te(r) {
  return r != null && typeof r == 'object'
}
var z0 = '[object Arguments]'
function Pf(r) {
  return Te(r) && De(r) == z0
}
var Lh = Object.prototype,
  W0 = Lh.hasOwnProperty,
  K0 = Lh.propertyIsEnumerable,
  ht = Pf(
    (function () {
      return arguments
    })(),
  )
    ? Pf
    : function (r) {
        return Te(r) && W0.call(r, 'callee') && !K0.call(r, 'callee')
      },
  oe = Array.isArray,
  V0 = 9007199254740991
function Go(r) {
  return typeof r == 'number' && r > -1 && r % 1 == 0 && r <= V0
}
function wr(r) {
  return r != null && Go(r.length) && !jo(r)
}
function X0(r) {
  return Te(r) && wr(r)
}
function Y0() {
  return !1
}
var Bh = typeof exports == 'object' && exports && !exports.nodeType && exports,
  qf = Bh && typeof module == 'object' && module && !module.nodeType && module,
  Z0 = qf && qf.exports === Bh,
  kf = Z0 ? ve.Buffer : void 0,
  J0 = kf ? kf.isBuffer : void 0,
  pt = J0 || Y0,
  Q0 = '[object Object]',
  ev = Function.prototype,
  rv = Object.prototype,
  jh = ev.toString,
  tv = rv.hasOwnProperty,
  nv = jh.call(Object)
function av(r) {
  if (!Te(r) || De(r) != Q0) return !1
  var e = Dh(r)
  if (e === null) return !0
  var t = tv.call(e, 'constructor') && e.constructor
  return typeof t == 'function' && t instanceof t && jh.call(t) == nv
}
var iv = '[object Arguments]',
  ov = '[object Array]',
  sv = '[object Boolean]',
  uv = '[object Date]',
  lv = '[object Error]',
  fv = '[object Function]',
  cv = '[object Map]',
  hv = '[object Number]',
  pv = '[object Object]',
  dv = '[object RegExp]',
  gv = '[object Set]',
  vv = '[object String]',
  bv = '[object WeakMap]',
  yv = '[object ArrayBuffer]',
  mv = '[object DataView]',
  xv = '[object Float32Array]',
  _v = '[object Float64Array]',
  wv = '[object Int8Array]',
  Sv = '[object Int16Array]',
  Cv = '[object Int32Array]',
  Ev = '[object Uint8Array]',
  Rv = '[object Uint8ClampedArray]',
  Ov = '[object Uint16Array]',
  Av = '[object Uint32Array]',
  K = {}
K[xv] = K[_v] = K[wv] = K[Sv] = K[Cv] = K[Ev] = K[Rv] = K[Ov] = K[Av] = !0
K[iv] =
  K[ov] =
  K[yv] =
  K[sv] =
  K[mv] =
  K[uv] =
  K[lv] =
  K[fv] =
  K[cv] =
  K[hv] =
  K[pv] =
  K[dv] =
  K[gv] =
  K[vv] =
  K[bv] =
    !1
function Tv(r) {
  return Te(r) && Go(r.length) && !!K[De(r)]
}
function Mv(r) {
  return function (e) {
    return r(e)
  }
}
var $h = typeof exports == 'object' && exports && !exports.nodeType && exports,
  Fr = $h && typeof module == 'object' && module && !module.nodeType && module,
  Pv = Fr && Fr.exports === $h,
  Bi = Pv && qh.process,
  If = (function () {
    try {
      var r = Fr && Fr.require && Fr.require('util').types
      return r || (Bi && Bi.binding && Bi.binding('util'))
    } catch {}
  })(),
  Ff = If && If.isTypedArray,
  Uo = Ff ? Mv(Ff) : Tv
function vo(r, e) {
  if (!(e === 'constructor' && typeof r[e] == 'function') && e != '__proto__') return r[e]
}
var qv = Object.prototype,
  kv = qv.hasOwnProperty
function Iv(r, e, t) {
  var n = r[e]
  ;(!(kv.call(r, e) && Kr(n, t)) || (t === void 0 && !(e in r))) && $o(r, e, t)
}
function Fv(r, e, t, n) {
  var a = !t
  t || (t = {})
  for (var i = -1, o = e.length; ++i < o; ) {
    var s = e[i],
      u = void 0
    ;(u === void 0 && (u = r[s]), a ? $o(t, s, u) : Iv(t, s, u))
  }
  return t
}
function Hv(r, e) {
  for (var t = -1, n = Array(r); ++t < r; ) n[t] = e(t)
  return n
}
var Dv = 9007199254740991,
  Lv = /^(?:0|[1-9]\d*)$/
function zo(r, e) {
  var t = typeof r
  return (
    (e = e ?? Dv),
    !!e && (t == 'number' || (t != 'symbol' && Lv.test(r))) && r > -1 && r % 1 == 0 && r < e
  )
}
var Bv = Object.prototype,
  jv = Bv.hasOwnProperty
function Nh(r, e) {
  var t = oe(r),
    n = !t && ht(r),
    a = !t && !n && pt(r),
    i = !t && !n && !a && Uo(r),
    o = t || n || a || i,
    s = o ? Hv(r.length, String) : [],
    u = s.length
  for (var l in r)
    (e || jv.call(r, l)) &&
      !(
        o &&
        (l == 'length' ||
          (a && (l == 'offset' || l == 'parent')) ||
          (i && (l == 'buffer' || l == 'byteLength' || l == 'byteOffset')) ||
          zo(l, u))
      ) &&
      s.push(l)
  return s
}
function $v(r) {
  var e = []
  if (r != null) for (var t in Object(r)) e.push(t)
  return e
}
var Nv = Object.prototype,
  Gv = Nv.hasOwnProperty
function Uv(r) {
  if (!le(r)) return $v(r)
  var e = No(r),
    t = []
  for (var n in r) (n == 'constructor' && (e || !Gv.call(r, n))) || t.push(n)
  return t
}
function Gh(r) {
  return wr(r) ? Nh(r, !0) : Uv(r)
}
function zv(r) {
  return Fv(r, Gh(r))
}
function Wv(r, e, t, n, a, i, o) {
  var s = vo(r, t),
    u = vo(e, t),
    l = o.get(u)
  if (l) {
    go(r, t, l)
    return
  }
  var f = i ? i(s, u, t + '', r, e, o) : void 0,
    c = f === void 0
  if (c) {
    var h = oe(u),
      d = !h && pt(u),
      g = !h && !d && Uo(u)
    ;((f = u),
      h || d || g
        ? oe(s)
          ? (f = s)
          : X0(s)
            ? (f = $0(s))
            : d
              ? ((c = !1), (f = L0(u)))
              : g
                ? ((c = !1), (f = j0(u)))
                : (f = [])
        : av(u) || ht(u)
          ? ((f = s), ht(s) ? (f = zv(s)) : (!le(s) || jo(s)) && (f = U0(u)))
          : (c = !1))
  }
  ;(c && (o.set(u, f), a(f, u, n, i, o), o.delete(u)), go(r, t, f))
}
function Uh(r, e, t, n, a) {
  r !== e &&
    Ih(
      e,
      function (i, o) {
        if ((a || (a = new ye()), le(i))) Wv(r, e, o, t, Uh, n, a)
        else {
          var s = n ? n(vo(r, o), i, o + '', r, e, a) : void 0
          ;(s === void 0 && (s = i), go(r, o, s))
        }
      },
      Gh,
    )
}
function Mt(r) {
  return r
}
function Kv(r, e, t) {
  switch (t.length) {
    case 0:
      return r.call(e)
    case 1:
      return r.call(e, t[0])
    case 2:
      return r.call(e, t[0], t[1])
    case 3:
      return r.call(e, t[0], t[1], t[2])
  }
  return r.apply(e, t)
}
var Hf = Math.max
function Vv(r, e, t) {
  return (
    (e = Hf(e === void 0 ? r.length - 1 : e, 0)),
    function () {
      for (var n = arguments, a = -1, i = Hf(n.length - e, 0), o = Array(i); ++a < i; )
        o[a] = n[e + a]
      a = -1
      for (var s = Array(e + 1); ++a < e; ) s[a] = n[a]
      return ((s[e] = t(o)), Kv(r, this, s))
    }
  )
}
function Xv(r) {
  return function () {
    return r
  }
}
var Yv = ft
    ? function (r, e) {
        return ft(r, 'toString', {configurable: !0, enumerable: !1, value: Xv(e), writable: !0})
      }
    : Mt,
  Zv = 800,
  Jv = 16,
  Qv = Date.now
function eb(r) {
  var e = 0,
    t = 0
  return function () {
    var n = Qv(),
      a = Jv - (n - t)
    if (((t = n), a > 0)) {
      if (++e >= Zv) return arguments[0]
    } else e = 0
    return r.apply(void 0, arguments)
  }
}
var rb = eb(Yv)
function tb(r, e) {
  return rb(Vv(r, e, Mt), r + '')
}
function nb(r, e, t) {
  if (!le(t)) return !1
  var n = typeof e
  return (n == 'number' ? wr(t) && zo(e, t.length) : n == 'string' && e in t) ? Kr(t[e], r) : !1
}
function ab(r) {
  return tb(function (e, t) {
    var n = -1,
      a = t.length,
      i = a > 1 ? t[a - 1] : void 0,
      o = a > 2 ? t[2] : void 0
    for (
      i = r.length > 3 && typeof i == 'function' ? (a--, i) : void 0,
        o && nb(t[0], t[1], o) && ((i = a < 3 ? void 0 : i), (a = 1)),
        e = Object(e);
      ++n < a;

    ) {
      var s = t[n]
      s && r(e, s, n, i)
    }
    return e
  })
}
var te = ab(function (r, e, t) {
    Uh(r, e, t)
  }),
  Vr = function (e) {
    var t = e.zDepth,
      n = e.radius,
      a = e.background,
      i = e.children,
      o = e.styles,
      s = o === void 0 ? {} : o,
      u = L(
        te(
          {
            default: {
              wrap: {position: 'relative', display: 'inline-block'},
              content: {position: 'relative'},
              bg: {
                absolute: '0px 0px 0px 0px',
                boxShadow: '0 ' + t + 'px ' + t * 4 + 'px rgba(0,0,0,.24)',
                borderRadius: n,
                background: a,
              },
            },
            'zDepth-0': {bg: {boxShadow: 'none'}},
            'zDepth-1': {bg: {boxShadow: '0 2px 10px rgba(0,0,0,.12), 0 2px 5px rgba(0,0,0,.16)'}},
            'zDepth-2': {bg: {boxShadow: '0 6px 20px rgba(0,0,0,.19), 0 8px 17px rgba(0,0,0,.2)'}},
            'zDepth-3': {
              bg: {boxShadow: '0 17px 50px rgba(0,0,0,.19), 0 12px 15px rgba(0,0,0,.24)'},
            },
            'zDepth-4': {
              bg: {boxShadow: '0 25px 55px rgba(0,0,0,.21), 0 16px 28px rgba(0,0,0,.22)'},
            },
            'zDepth-5': {
              bg: {boxShadow: '0 40px 77px rgba(0,0,0,.22), 0 27px 24px rgba(0,0,0,.2)'},
            },
            square: {bg: {borderRadius: '0'}},
            circle: {bg: {borderRadius: '50%'}},
          },
          s,
        ),
        {'zDepth-1': t === 1},
      )
    return p.createElement(
      'div',
      {style: u.wrap},
      p.createElement('div', {style: u.bg}),
      p.createElement('div', {style: u.content}, i),
    )
  }
Vr.propTypes = {
  background: P.string,
  zDepth: P.oneOf([0, 1, 2, 3, 4, 5]),
  radius: P.number,
  styles: P.object,
}
Vr.defaultProps = {background: '#fff', zDepth: 1, radius: 2, styles: {}}
var ji = function () {
    return ve.Date.now()
  },
  ib = /\s/
function ob(r) {
  for (var e = r.length; e-- && ib.test(r.charAt(e)); );
  return e
}
var sb = /^\s+/
function ub(r) {
  return r && r.slice(0, ob(r) + 1).replace(sb, '')
}
var lb = '[object Symbol]'
function Pt(r) {
  return typeof r == 'symbol' || (Te(r) && De(r) == lb)
}
var Df = NaN,
  fb = /^[-+]0x[0-9a-f]+$/i,
  cb = /^0b[01]+$/i,
  hb = /^0o[0-7]+$/i,
  pb = parseInt
function Lf(r) {
  if (typeof r == 'number') return r
  if (Pt(r)) return Df
  if (le(r)) {
    var e = typeof r.valueOf == 'function' ? r.valueOf() : r
    r = le(e) ? e + '' : e
  }
  if (typeof r != 'string') return r === 0 ? r : +r
  r = ub(r)
  var t = cb.test(r)
  return t || hb.test(r) ? pb(r.slice(2), t ? 2 : 8) : fb.test(r) ? Df : +r
}
var db = 'Expected a function',
  gb = Math.max,
  vb = Math.min
function zh(r, e, t) {
  var n,
    a,
    i,
    o,
    s,
    u,
    l = 0,
    f = !1,
    c = !1,
    h = !0
  if (typeof r != 'function') throw new TypeError(db)
  ;((e = Lf(e) || 0),
    le(t) &&
      ((f = !!t.leading),
      (c = 'maxWait' in t),
      (i = c ? gb(Lf(t.maxWait) || 0, e) : i),
      (h = 'trailing' in t ? !!t.trailing : h)))
  function d(R) {
    var A = n,
      T = a
    return ((n = a = void 0), (l = R), (o = r.apply(T, A)), o)
  }
  function g(R) {
    return ((l = R), (s = setTimeout(w, e)), f ? d(R) : o)
  }
  function v(R) {
    var A = R - u,
      T = R - l,
      I = e - A
    return c ? vb(I, i - T) : I
  }
  function b(R) {
    var A = R - u,
      T = R - l
    return u === void 0 || A >= e || A < 0 || (c && T >= i)
  }
  function w() {
    var R = ji()
    if (b(R)) return _(R)
    s = setTimeout(w, v(R))
  }
  function _(R) {
    return ((s = void 0), h && n ? d(R) : ((n = a = void 0), o))
  }
  function C() {
    ;(s !== void 0 && clearTimeout(s), (l = 0), (n = u = a = s = void 0))
  }
  function S() {
    return s === void 0 ? o : _(ji())
  }
  function E() {
    var R = ji(),
      A = b(R)
    if (((n = arguments), (a = this), (u = R), A)) {
      if (s === void 0) return g(u)
      if (c) return (clearTimeout(s), (s = setTimeout(w, e)), d(u))
    }
    return (s === void 0 && (s = setTimeout(w, e)), o)
  }
  return ((E.cancel = C), (E.flush = S), E)
}
var bb = 'Expected a function'
function yb(r, e, t) {
  var n = !0,
    a = !0
  if (typeof r != 'function') throw new TypeError(bb)
  return (
    le(t) && ((n = 'leading' in t ? !!t.leading : n), (a = 'trailing' in t ? !!t.trailing : a)),
    zh(r, e, {leading: n, maxWait: e, trailing: a})
  )
}
var mb = function (e, t, n) {
    var a = n.getBoundingClientRect(),
      i = a.width,
      o = a.height,
      s = typeof e.pageX == 'number' ? e.pageX : e.touches[0].pageX,
      u = typeof e.pageY == 'number' ? e.pageY : e.touches[0].pageY,
      l = s - (n.getBoundingClientRect().left + window.pageXOffset),
      f = u - (n.getBoundingClientRect().top + window.pageYOffset)
    ;(l < 0 ? (l = 0) : l > i && (l = i), f < 0 ? (f = 0) : f > o && (f = o))
    var c = l / i,
      h = 1 - f / o
    return {h: t.h, s: c, v: h, a: t.a, source: 'hsv'}
  },
  xb = (function () {
    function r(e, t) {
      for (var n = 0; n < t.length; n++) {
        var a = t[n]
        ;((a.enumerable = a.enumerable || !1),
          (a.configurable = !0),
          'value' in a && (a.writable = !0),
          Object.defineProperty(e, a.key, a))
      }
    }
    return function (e, t, n) {
      return (t && r(e.prototype, t), n && r(e, n), e)
    }
  })()
function _b(r, e) {
  if (!(r instanceof e)) throw new TypeError('Cannot call a class as a function')
}
function wb(r, e) {
  if (!r) throw new ReferenceError("this hasn't been initialised - super() hasn't been called")
  return e && (typeof e == 'object' || typeof e == 'function') ? e : r
}
function Sb(r, e) {
  if (typeof e != 'function' && e !== null)
    throw new TypeError('Super expression must either be null or a function, not ' + typeof e)
  ;((r.prototype = Object.create(e && e.prototype, {
    constructor: {value: r, enumerable: !1, writable: !0, configurable: !0},
  })),
    e && (Object.setPrototypeOf ? Object.setPrototypeOf(r, e) : (r.__proto__ = e)))
}
var qt = (function (r) {
  Sb(e, r)
  function e(t) {
    _b(this, e)
    var n = wb(this, (e.__proto__ || Object.getPrototypeOf(e)).call(this, t))
    return (
      (n.handleChange = function (a) {
        typeof n.props.onChange == 'function' &&
          n.throttle(n.props.onChange, mb(a, n.props.hsl, n.container), a)
      }),
      (n.handleMouseDown = function (a) {
        n.handleChange(a)
        var i = n.getContainerRenderWindow()
        ;(i.addEventListener('mousemove', n.handleChange),
          i.addEventListener('mouseup', n.handleMouseUp))
      }),
      (n.handleMouseUp = function () {
        n.unbindEventListeners()
      }),
      (n.throttle = yb(function (a, i, o) {
        a(i, o)
      }, 50)),
      n
    )
  }
  return (
    xb(e, [
      {
        key: 'componentWillUnmount',
        value: function () {
          ;(this.throttle.cancel(), this.unbindEventListeners())
        },
      },
      {
        key: 'getContainerRenderWindow',
        value: function () {
          for (var n = this.container, a = window; !a.document.contains(n) && a.parent !== a; )
            a = a.parent
          return a
        },
      },
      {
        key: 'unbindEventListeners',
        value: function () {
          var n = this.getContainerRenderWindow()
          ;(n.removeEventListener('mousemove', this.handleChange),
            n.removeEventListener('mouseup', this.handleMouseUp))
        },
      },
      {
        key: 'render',
        value: function () {
          var n = this,
            a = this.props.style || {},
            i = a.color,
            o = a.white,
            s = a.black,
            u = a.pointer,
            l = a.circle,
            f = L(
              {
                default: {
                  color: {
                    absolute: '0px 0px 0px 0px',
                    background: 'hsl(' + this.props.hsl.h + ',100%, 50%)',
                    borderRadius: this.props.radius,
                  },
                  white: {absolute: '0px 0px 0px 0px', borderRadius: this.props.radius},
                  black: {
                    absolute: '0px 0px 0px 0px',
                    boxShadow: this.props.shadow,
                    borderRadius: this.props.radius,
                  },
                  pointer: {
                    position: 'absolute',
                    top: -(this.props.hsv.v * 100) + 100 + '%',
                    left: this.props.hsv.s * 100 + '%',
                    cursor: 'default',
                  },
                  circle: {
                    width: '4px',
                    height: '4px',
                    boxShadow: `0 0 0 1.5px #fff, inset 0 0 1px 1px rgba(0,0,0,.3),
            0 0 1px 2px rgba(0,0,0,.4)`,
                    borderRadius: '50%',
                    cursor: 'hand',
                    transform: 'translate(-2px, -2px)',
                  },
                },
                custom: {color: i, white: o, black: s, pointer: u, circle: l},
              },
              {custom: !!this.props.style},
            )
          return p.createElement(
            'div',
            {
              style: f.color,
              ref: function (h) {
                return (n.container = h)
              },
              onMouseDown: this.handleMouseDown,
              onTouchMove: this.handleChange,
              onTouchStart: this.handleChange,
            },
            p.createElement(
              'style',
              null,
              `
          .saturation-white {
            background: -webkit-linear-gradient(to right, #fff, rgba(255,255,255,0));
            background: linear-gradient(to right, #fff, rgba(255,255,255,0));
          }
          .saturation-black {
            background: -webkit-linear-gradient(to top, #000, rgba(0,0,0,0));
            background: linear-gradient(to top, #000, rgba(0,0,0,0));
          }
        `,
            ),
            p.createElement(
              'div',
              {style: f.white, className: 'saturation-white'},
              p.createElement('div', {style: f.black, className: 'saturation-black'}),
              p.createElement(
                'div',
                {style: f.pointer},
                this.props.pointer
                  ? p.createElement(this.props.pointer, this.props)
                  : p.createElement('div', {style: f.circle}),
              ),
            ),
          )
        },
      },
    ]),
    e
  )
})(Br || jr)
function Cb(r, e) {
  for (var t = -1, n = r == null ? 0 : r.length; ++t < n && e(r[t], t, r) !== !1; );
  return r
}
var Eb = Hh(Object.keys, Object),
  Rb = Object.prototype,
  Ob = Rb.hasOwnProperty
function Ab(r) {
  if (!No(r)) return Eb(r)
  var e = []
  for (var t in Object(r)) Ob.call(r, t) && t != 'constructor' && e.push(t)
  return e
}
function Wo(r) {
  return wr(r) ? Nh(r) : Ab(r)
}
function Tb(r, e) {
  return r && Ih(r, e, Wo)
}
function Mb(r, e) {
  return function (t, n) {
    if (t == null) return t
    if (!wr(t)) return r(t, n)
    for (var a = t.length, i = -1, o = Object(t); ++i < a && n(o[i], i, o) !== !1; );
    return t
  }
}
var Wh = Mb(Tb)
function Pb(r) {
  return typeof r == 'function' ? r : Mt
}
function qb(r, e) {
  var t = oe(r) ? Cb : Wh
  return t(r, Pb(e))
}
function dt(r) {
  '@babel/helpers - typeof'
  return (
    (dt =
      typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
        ? function (e) {
            return typeof e
          }
        : function (e) {
            return e &&
              typeof Symbol == 'function' &&
              e.constructor === Symbol &&
              e !== Symbol.prototype
              ? 'symbol'
              : typeof e
          }),
    dt(r)
  )
}
var kb = /^\s+/,
  Ib = /\s+$/
function F(r, e) {
  if (((r = r || ''), (e = e || {}), r instanceof F)) return r
  if (!(this instanceof F)) return new F(r, e)
  var t = Fb(r)
  ;((this._originalInput = r),
    (this._r = t.r),
    (this._g = t.g),
    (this._b = t.b),
    (this._a = t.a),
    (this._roundA = Math.round(100 * this._a) / 100),
    (this._format = e.format || t.format),
    (this._gradientType = e.gradientType),
    this._r < 1 && (this._r = Math.round(this._r)),
    this._g < 1 && (this._g = Math.round(this._g)),
    this._b < 1 && (this._b = Math.round(this._b)),
    (this._ok = t.ok))
}
F.prototype = {
  isDark: function () {
    return this.getBrightness() < 128
  },
  isLight: function () {
    return !this.isDark()
  },
  isValid: function () {
    return this._ok
  },
  getOriginalInput: function () {
    return this._originalInput
  },
  getFormat: function () {
    return this._format
  },
  getAlpha: function () {
    return this._a
  },
  getBrightness: function () {
    var e = this.toRgb()
    return (e.r * 299 + e.g * 587 + e.b * 114) / 1e3
  },
  getLuminance: function () {
    var e = this.toRgb(),
      t,
      n,
      a,
      i,
      o,
      s
    return (
      (t = e.r / 255),
      (n = e.g / 255),
      (a = e.b / 255),
      t <= 0.03928 ? (i = t / 12.92) : (i = Math.pow((t + 0.055) / 1.055, 2.4)),
      n <= 0.03928 ? (o = n / 12.92) : (o = Math.pow((n + 0.055) / 1.055, 2.4)),
      a <= 0.03928 ? (s = a / 12.92) : (s = Math.pow((a + 0.055) / 1.055, 2.4)),
      0.2126 * i + 0.7152 * o + 0.0722 * s
    )
  },
  setAlpha: function (e) {
    return ((this._a = Kh(e)), (this._roundA = Math.round(100 * this._a) / 100), this)
  },
  toHsv: function () {
    var e = jf(this._r, this._g, this._b)
    return {h: e.h * 360, s: e.s, v: e.v, a: this._a}
  },
  toHsvString: function () {
    var e = jf(this._r, this._g, this._b),
      t = Math.round(e.h * 360),
      n = Math.round(e.s * 100),
      a = Math.round(e.v * 100)
    return this._a == 1
      ? 'hsv(' + t + ', ' + n + '%, ' + a + '%)'
      : 'hsva(' + t + ', ' + n + '%, ' + a + '%, ' + this._roundA + ')'
  },
  toHsl: function () {
    var e = Bf(this._r, this._g, this._b)
    return {h: e.h * 360, s: e.s, l: e.l, a: this._a}
  },
  toHslString: function () {
    var e = Bf(this._r, this._g, this._b),
      t = Math.round(e.h * 360),
      n = Math.round(e.s * 100),
      a = Math.round(e.l * 100)
    return this._a == 1
      ? 'hsl(' + t + ', ' + n + '%, ' + a + '%)'
      : 'hsla(' + t + ', ' + n + '%, ' + a + '%, ' + this._roundA + ')'
  },
  toHex: function (e) {
    return $f(this._r, this._g, this._b, e)
  },
  toHexString: function (e) {
    return '#' + this.toHex(e)
  },
  toHex8: function (e) {
    return Bb(this._r, this._g, this._b, this._a, e)
  },
  toHex8String: function (e) {
    return '#' + this.toHex8(e)
  },
  toRgb: function () {
    return {r: Math.round(this._r), g: Math.round(this._g), b: Math.round(this._b), a: this._a}
  },
  toRgbString: function () {
    return this._a == 1
      ? 'rgb(' + Math.round(this._r) + ', ' + Math.round(this._g) + ', ' + Math.round(this._b) + ')'
      : 'rgba(' +
          Math.round(this._r) +
          ', ' +
          Math.round(this._g) +
          ', ' +
          Math.round(this._b) +
          ', ' +
          this._roundA +
          ')'
  },
  toPercentageRgb: function () {
    return {
      r: Math.round(X(this._r, 255) * 100) + '%',
      g: Math.round(X(this._g, 255) * 100) + '%',
      b: Math.round(X(this._b, 255) * 100) + '%',
      a: this._a,
    }
  },
  toPercentageRgbString: function () {
    return this._a == 1
      ? 'rgb(' +
          Math.round(X(this._r, 255) * 100) +
          '%, ' +
          Math.round(X(this._g, 255) * 100) +
          '%, ' +
          Math.round(X(this._b, 255) * 100) +
          '%)'
      : 'rgba(' +
          Math.round(X(this._r, 255) * 100) +
          '%, ' +
          Math.round(X(this._g, 255) * 100) +
          '%, ' +
          Math.round(X(this._b, 255) * 100) +
          '%, ' +
          this._roundA +
          ')'
  },
  toName: function () {
    return this._a === 0
      ? 'transparent'
      : this._a < 1
        ? !1
        : Zb[$f(this._r, this._g, this._b, !0)] || !1
  },
  toFilter: function (e) {
    var t = '#' + Nf(this._r, this._g, this._b, this._a),
      n = t,
      a = this._gradientType ? 'GradientType = 1, ' : ''
    if (e) {
      var i = F(e)
      n = '#' + Nf(i._r, i._g, i._b, i._a)
    }
    return (
      'progid:DXImageTransform.Microsoft.gradient(' +
      a +
      'startColorstr=' +
      t +
      ',endColorstr=' +
      n +
      ')'
    )
  },
  toString: function (e) {
    var t = !!e
    e = e || this._format
    var n = !1,
      a = this._a < 1 && this._a >= 0,
      i =
        !t &&
        a &&
        (e === 'hex' ||
          e === 'hex6' ||
          e === 'hex3' ||
          e === 'hex4' ||
          e === 'hex8' ||
          e === 'name')
    return i
      ? e === 'name' && this._a === 0
        ? this.toName()
        : this.toRgbString()
      : (e === 'rgb' && (n = this.toRgbString()),
        e === 'prgb' && (n = this.toPercentageRgbString()),
        (e === 'hex' || e === 'hex6') && (n = this.toHexString()),
        e === 'hex3' && (n = this.toHexString(!0)),
        e === 'hex4' && (n = this.toHex8String(!0)),
        e === 'hex8' && (n = this.toHex8String()),
        e === 'name' && (n = this.toName()),
        e === 'hsl' && (n = this.toHslString()),
        e === 'hsv' && (n = this.toHsvString()),
        n || this.toHexString())
  },
  clone: function () {
    return F(this.toString())
  },
  _applyModification: function (e, t) {
    var n = e.apply(null, [this].concat([].slice.call(t)))
    return ((this._r = n._r), (this._g = n._g), (this._b = n._b), this.setAlpha(n._a), this)
  },
  lighten: function () {
    return this._applyModification(Gb, arguments)
  },
  brighten: function () {
    return this._applyModification(Ub, arguments)
  },
  darken: function () {
    return this._applyModification(zb, arguments)
  },
  desaturate: function () {
    return this._applyModification(jb, arguments)
  },
  saturate: function () {
    return this._applyModification($b, arguments)
  },
  greyscale: function () {
    return this._applyModification(Nb, arguments)
  },
  spin: function () {
    return this._applyModification(Wb, arguments)
  },
  _applyCombination: function (e, t) {
    return e.apply(null, [this].concat([].slice.call(t)))
  },
  analogous: function () {
    return this._applyCombination(Xb, arguments)
  },
  complement: function () {
    return this._applyCombination(Kb, arguments)
  },
  monochromatic: function () {
    return this._applyCombination(Yb, arguments)
  },
  splitcomplement: function () {
    return this._applyCombination(Vb, arguments)
  },
  triad: function () {
    return this._applyCombination(Gf, [3])
  },
  tetrad: function () {
    return this._applyCombination(Gf, [4])
  },
}
F.fromRatio = function (r, e) {
  if (dt(r) == 'object') {
    var t = {}
    for (var n in r) r.hasOwnProperty(n) && (n === 'a' ? (t[n] = r[n]) : (t[n] = qr(r[n])))
    r = t
  }
  return F(r, e)
}
function Fb(r) {
  var e = {r: 0, g: 0, b: 0},
    t = 1,
    n = null,
    a = null,
    i = null,
    o = !1,
    s = !1
  return (
    typeof r == 'string' && (r = ry(r)),
    dt(r) == 'object' &&
      (xe(r.r) && xe(r.g) && xe(r.b)
        ? ((e = Hb(r.r, r.g, r.b)), (o = !0), (s = String(r.r).substr(-1) === '%' ? 'prgb' : 'rgb'))
        : xe(r.h) && xe(r.s) && xe(r.v)
          ? ((n = qr(r.s)), (a = qr(r.v)), (e = Lb(r.h, n, a)), (o = !0), (s = 'hsv'))
          : xe(r.h) &&
            xe(r.s) &&
            xe(r.l) &&
            ((n = qr(r.s)), (i = qr(r.l)), (e = Db(r.h, n, i)), (o = !0), (s = 'hsl')),
      r.hasOwnProperty('a') && (t = r.a)),
    (t = Kh(t)),
    {
      ok: o,
      format: r.format || s,
      r: Math.min(255, Math.max(e.r, 0)),
      g: Math.min(255, Math.max(e.g, 0)),
      b: Math.min(255, Math.max(e.b, 0)),
      a: t,
    }
  )
}
function Hb(r, e, t) {
  return {r: X(r, 255) * 255, g: X(e, 255) * 255, b: X(t, 255) * 255}
}
function Bf(r, e, t) {
  ;((r = X(r, 255)), (e = X(e, 255)), (t = X(t, 255)))
  var n = Math.max(r, e, t),
    a = Math.min(r, e, t),
    i,
    o,
    s = (n + a) / 2
  if (n == a) i = o = 0
  else {
    var u = n - a
    switch (((o = s > 0.5 ? u / (2 - n - a) : u / (n + a)), n)) {
      case r:
        i = (e - t) / u + (e < t ? 6 : 0)
        break
      case e:
        i = (t - r) / u + 2
        break
      case t:
        i = (r - e) / u + 4
        break
    }
    i /= 6
  }
  return {h: i, s: o, l: s}
}
function Db(r, e, t) {
  var n, a, i
  ;((r = X(r, 360)), (e = X(e, 100)), (t = X(t, 100)))
  function o(l, f, c) {
    return (
      c < 0 && (c += 1),
      c > 1 && (c -= 1),
      c < 1 / 6
        ? l + (f - l) * 6 * c
        : c < 1 / 2
          ? f
          : c < 2 / 3
            ? l + (f - l) * (2 / 3 - c) * 6
            : l
    )
  }
  if (e === 0) n = a = i = t
  else {
    var s = t < 0.5 ? t * (1 + e) : t + e - t * e,
      u = 2 * t - s
    ;((n = o(u, s, r + 1 / 3)), (a = o(u, s, r)), (i = o(u, s, r - 1 / 3)))
  }
  return {r: n * 255, g: a * 255, b: i * 255}
}
function jf(r, e, t) {
  ;((r = X(r, 255)), (e = X(e, 255)), (t = X(t, 255)))
  var n = Math.max(r, e, t),
    a = Math.min(r, e, t),
    i,
    o,
    s = n,
    u = n - a
  if (((o = n === 0 ? 0 : u / n), n == a)) i = 0
  else {
    switch (n) {
      case r:
        i = (e - t) / u + (e < t ? 6 : 0)
        break
      case e:
        i = (t - r) / u + 2
        break
      case t:
        i = (r - e) / u + 4
        break
    }
    i /= 6
  }
  return {h: i, s: o, v: s}
}
function Lb(r, e, t) {
  ;((r = X(r, 360) * 6), (e = X(e, 100)), (t = X(t, 100)))
  var n = Math.floor(r),
    a = r - n,
    i = t * (1 - e),
    o = t * (1 - a * e),
    s = t * (1 - (1 - a) * e),
    u = n % 6,
    l = [t, o, i, i, s, t][u],
    f = [s, t, t, o, i, i][u],
    c = [i, i, s, t, t, o][u]
  return {r: l * 255, g: f * 255, b: c * 255}
}
function $f(r, e, t, n) {
  var a = [
    de(Math.round(r).toString(16)),
    de(Math.round(e).toString(16)),
    de(Math.round(t).toString(16)),
  ]
  return n &&
    a[0].charAt(0) == a[0].charAt(1) &&
    a[1].charAt(0) == a[1].charAt(1) &&
    a[2].charAt(0) == a[2].charAt(1)
    ? a[0].charAt(0) + a[1].charAt(0) + a[2].charAt(0)
    : a.join('')
}
function Bb(r, e, t, n, a) {
  var i = [
    de(Math.round(r).toString(16)),
    de(Math.round(e).toString(16)),
    de(Math.round(t).toString(16)),
    de(Vh(n)),
  ]
  return a &&
    i[0].charAt(0) == i[0].charAt(1) &&
    i[1].charAt(0) == i[1].charAt(1) &&
    i[2].charAt(0) == i[2].charAt(1) &&
    i[3].charAt(0) == i[3].charAt(1)
    ? i[0].charAt(0) + i[1].charAt(0) + i[2].charAt(0) + i[3].charAt(0)
    : i.join('')
}
function Nf(r, e, t, n) {
  var a = [
    de(Vh(n)),
    de(Math.round(r).toString(16)),
    de(Math.round(e).toString(16)),
    de(Math.round(t).toString(16)),
  ]
  return a.join('')
}
F.equals = function (r, e) {
  return !r || !e ? !1 : F(r).toRgbString() == F(e).toRgbString()
}
F.random = function () {
  return F.fromRatio({r: Math.random(), g: Math.random(), b: Math.random()})
}
function jb(r, e) {
  e = e === 0 ? 0 : e || 10
  var t = F(r).toHsl()
  return ((t.s -= e / 100), (t.s = kt(t.s)), F(t))
}
function $b(r, e) {
  e = e === 0 ? 0 : e || 10
  var t = F(r).toHsl()
  return ((t.s += e / 100), (t.s = kt(t.s)), F(t))
}
function Nb(r) {
  return F(r).desaturate(100)
}
function Gb(r, e) {
  e = e === 0 ? 0 : e || 10
  var t = F(r).toHsl()
  return ((t.l += e / 100), (t.l = kt(t.l)), F(t))
}
function Ub(r, e) {
  e = e === 0 ? 0 : e || 10
  var t = F(r).toRgb()
  return (
    (t.r = Math.max(0, Math.min(255, t.r - Math.round(255 * -(e / 100))))),
    (t.g = Math.max(0, Math.min(255, t.g - Math.round(255 * -(e / 100))))),
    (t.b = Math.max(0, Math.min(255, t.b - Math.round(255 * -(e / 100))))),
    F(t)
  )
}
function zb(r, e) {
  e = e === 0 ? 0 : e || 10
  var t = F(r).toHsl()
  return ((t.l -= e / 100), (t.l = kt(t.l)), F(t))
}
function Wb(r, e) {
  var t = F(r).toHsl(),
    n = (t.h + e) % 360
  return ((t.h = n < 0 ? 360 + n : n), F(t))
}
function Kb(r) {
  var e = F(r).toHsl()
  return ((e.h = (e.h + 180) % 360), F(e))
}
function Gf(r, e) {
  if (isNaN(e) || e <= 0) throw new Error('Argument to polyad must be a positive number')
  for (var t = F(r).toHsl(), n = [F(r)], a = 360 / e, i = 1; i < e; i++)
    n.push(F({h: (t.h + i * a) % 360, s: t.s, l: t.l}))
  return n
}
function Vb(r) {
  var e = F(r).toHsl(),
    t = e.h
  return [F(r), F({h: (t + 72) % 360, s: e.s, l: e.l}), F({h: (t + 216) % 360, s: e.s, l: e.l})]
}
function Xb(r, e, t) {
  ;((e = e || 6), (t = t || 30))
  var n = F(r).toHsl(),
    a = 360 / t,
    i = [F(r)]
  for (n.h = (n.h - ((a * e) >> 1) + 720) % 360; --e; ) ((n.h = (n.h + a) % 360), i.push(F(n)))
  return i
}
function Yb(r, e) {
  e = e || 6
  for (var t = F(r).toHsv(), n = t.h, a = t.s, i = t.v, o = [], s = 1 / e; e--; )
    (o.push(F({h: n, s: a, v: i})), (i = (i + s) % 1))
  return o
}
F.mix = function (r, e, t) {
  t = t === 0 ? 0 : t || 50
  var n = F(r).toRgb(),
    a = F(e).toRgb(),
    i = t / 100,
    o = {
      r: (a.r - n.r) * i + n.r,
      g: (a.g - n.g) * i + n.g,
      b: (a.b - n.b) * i + n.b,
      a: (a.a - n.a) * i + n.a,
    }
  return F(o)
}
F.readability = function (r, e) {
  var t = F(r),
    n = F(e)
  return (
    (Math.max(t.getLuminance(), n.getLuminance()) + 0.05) /
    (Math.min(t.getLuminance(), n.getLuminance()) + 0.05)
  )
}
F.isReadable = function (r, e, t) {
  var n = F.readability(r, e),
    a,
    i
  switch (((i = !1), (a = ty(t)), a.level + a.size)) {
    case 'AAsmall':
    case 'AAAlarge':
      i = n >= 4.5
      break
    case 'AAlarge':
      i = n >= 3
      break
    case 'AAAsmall':
      i = n >= 7
      break
  }
  return i
}
F.mostReadable = function (r, e, t) {
  var n = null,
    a = 0,
    i,
    o,
    s,
    u
  ;((t = t || {}), (o = t.includeFallbackColors), (s = t.level), (u = t.size))
  for (var l = 0; l < e.length; l++)
    ((i = F.readability(r, e[l])), i > a && ((a = i), (n = F(e[l]))))
  return F.isReadable(r, n, {level: s, size: u}) || !o
    ? n
    : ((t.includeFallbackColors = !1), F.mostReadable(r, ['#fff', '#000'], t))
}
var bo = (F.names = {
    aliceblue: 'f0f8ff',
    antiquewhite: 'faebd7',
    aqua: '0ff',
    aquamarine: '7fffd4',
    azure: 'f0ffff',
    beige: 'f5f5dc',
    bisque: 'ffe4c4',
    black: '000',
    blanchedalmond: 'ffebcd',
    blue: '00f',
    blueviolet: '8a2be2',
    brown: 'a52a2a',
    burlywood: 'deb887',
    burntsienna: 'ea7e5d',
    cadetblue: '5f9ea0',
    chartreuse: '7fff00',
    chocolate: 'd2691e',
    coral: 'ff7f50',
    cornflowerblue: '6495ed',
    cornsilk: 'fff8dc',
    crimson: 'dc143c',
    cyan: '0ff',
    darkblue: '00008b',
    darkcyan: '008b8b',
    darkgoldenrod: 'b8860b',
    darkgray: 'a9a9a9',
    darkgreen: '006400',
    darkgrey: 'a9a9a9',
    darkkhaki: 'bdb76b',
    darkmagenta: '8b008b',
    darkolivegreen: '556b2f',
    darkorange: 'ff8c00',
    darkorchid: '9932cc',
    darkred: '8b0000',
    darksalmon: 'e9967a',
    darkseagreen: '8fbc8f',
    darkslateblue: '483d8b',
    darkslategray: '2f4f4f',
    darkslategrey: '2f4f4f',
    darkturquoise: '00ced1',
    darkviolet: '9400d3',
    deeppink: 'ff1493',
    deepskyblue: '00bfff',
    dimgray: '696969',
    dimgrey: '696969',
    dodgerblue: '1e90ff',
    firebrick: 'b22222',
    floralwhite: 'fffaf0',
    forestgreen: '228b22',
    fuchsia: 'f0f',
    gainsboro: 'dcdcdc',
    ghostwhite: 'f8f8ff',
    gold: 'ffd700',
    goldenrod: 'daa520',
    gray: '808080',
    green: '008000',
    greenyellow: 'adff2f',
    grey: '808080',
    honeydew: 'f0fff0',
    hotpink: 'ff69b4',
    indianred: 'cd5c5c',
    indigo: '4b0082',
    ivory: 'fffff0',
    khaki: 'f0e68c',
    lavender: 'e6e6fa',
    lavenderblush: 'fff0f5',
    lawngreen: '7cfc00',
    lemonchiffon: 'fffacd',
    lightblue: 'add8e6',
    lightcoral: 'f08080',
    lightcyan: 'e0ffff',
    lightgoldenrodyellow: 'fafad2',
    lightgray: 'd3d3d3',
    lightgreen: '90ee90',
    lightgrey: 'd3d3d3',
    lightpink: 'ffb6c1',
    lightsalmon: 'ffa07a',
    lightseagreen: '20b2aa',
    lightskyblue: '87cefa',
    lightslategray: '789',
    lightslategrey: '789',
    lightsteelblue: 'b0c4de',
    lightyellow: 'ffffe0',
    lime: '0f0',
    limegreen: '32cd32',
    linen: 'faf0e6',
    magenta: 'f0f',
    maroon: '800000',
    mediumaquamarine: '66cdaa',
    mediumblue: '0000cd',
    mediumorchid: 'ba55d3',
    mediumpurple: '9370db',
    mediumseagreen: '3cb371',
    mediumslateblue: '7b68ee',
    mediumspringgreen: '00fa9a',
    mediumturquoise: '48d1cc',
    mediumvioletred: 'c71585',
    midnightblue: '191970',
    mintcream: 'f5fffa',
    mistyrose: 'ffe4e1',
    moccasin: 'ffe4b5',
    navajowhite: 'ffdead',
    navy: '000080',
    oldlace: 'fdf5e6',
    olive: '808000',
    olivedrab: '6b8e23',
    orange: 'ffa500',
    orangered: 'ff4500',
    orchid: 'da70d6',
    palegoldenrod: 'eee8aa',
    palegreen: '98fb98',
    paleturquoise: 'afeeee',
    palevioletred: 'db7093',
    papayawhip: 'ffefd5',
    peachpuff: 'ffdab9',
    peru: 'cd853f',
    pink: 'ffc0cb',
    plum: 'dda0dd',
    powderblue: 'b0e0e6',
    purple: '800080',
    rebeccapurple: '663399',
    red: 'f00',
    rosybrown: 'bc8f8f',
    royalblue: '4169e1',
    saddlebrown: '8b4513',
    salmon: 'fa8072',
    sandybrown: 'f4a460',
    seagreen: '2e8b57',
    seashell: 'fff5ee',
    sienna: 'a0522d',
    silver: 'c0c0c0',
    skyblue: '87ceeb',
    slateblue: '6a5acd',
    slategray: '708090',
    slategrey: '708090',
    snow: 'fffafa',
    springgreen: '00ff7f',
    steelblue: '4682b4',
    tan: 'd2b48c',
    teal: '008080',
    thistle: 'd8bfd8',
    tomato: 'ff6347',
    turquoise: '40e0d0',
    violet: 'ee82ee',
    wheat: 'f5deb3',
    white: 'fff',
    whitesmoke: 'f5f5f5',
    yellow: 'ff0',
    yellowgreen: '9acd32',
  }),
  Zb = (F.hexNames = Jb(bo))
function Jb(r) {
  var e = {}
  for (var t in r) r.hasOwnProperty(t) && (e[r[t]] = t)
  return e
}
function Kh(r) {
  return ((r = parseFloat(r)), (isNaN(r) || r < 0 || r > 1) && (r = 1), r)
}
function X(r, e) {
  Qb(r) && (r = '100%')
  var t = ey(r)
  return (
    (r = Math.min(e, Math.max(0, parseFloat(r)))),
    t && (r = parseInt(r * e, 10) / 100),
    Math.abs(r - e) < 1e-6 ? 1 : (r % e) / parseFloat(e)
  )
}
function kt(r) {
  return Math.min(1, Math.max(0, r))
}
function ie(r) {
  return parseInt(r, 16)
}
function Qb(r) {
  return typeof r == 'string' && r.indexOf('.') != -1 && parseFloat(r) === 1
}
function ey(r) {
  return typeof r == 'string' && r.indexOf('%') != -1
}
function de(r) {
  return r.length == 1 ? '0' + r : '' + r
}
function qr(r) {
  return (r <= 1 && (r = r * 100 + '%'), r)
}
function Vh(r) {
  return Math.round(parseFloat(r) * 255).toString(16)
}
function Uf(r) {
  return ie(r) / 255
}
var pe = (function () {
  var r = '[-\\+]?\\d+%?',
    e = '[-\\+]?\\d*\\.\\d+%?',
    t = '(?:' + e + ')|(?:' + r + ')',
    n = '[\\s|\\(]+(' + t + ')[,|\\s]+(' + t + ')[,|\\s]+(' + t + ')\\s*\\)?',
    a = '[\\s|\\(]+(' + t + ')[,|\\s]+(' + t + ')[,|\\s]+(' + t + ')[,|\\s]+(' + t + ')\\s*\\)?'
  return {
    CSS_UNIT: new RegExp(t),
    rgb: new RegExp('rgb' + n),
    rgba: new RegExp('rgba' + a),
    hsl: new RegExp('hsl' + n),
    hsla: new RegExp('hsla' + a),
    hsv: new RegExp('hsv' + n),
    hsva: new RegExp('hsva' + a),
    hex3: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
    hex6: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
    hex4: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
    hex8: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
  }
})()
function xe(r) {
  return !!pe.CSS_UNIT.exec(r)
}
function ry(r) {
  r = r.replace(kb, '').replace(Ib, '').toLowerCase()
  var e = !1
  if (bo[r]) ((r = bo[r]), (e = !0))
  else if (r == 'transparent') return {r: 0, g: 0, b: 0, a: 0, format: 'name'}
  var t
  return (t = pe.rgb.exec(r))
    ? {r: t[1], g: t[2], b: t[3]}
    : (t = pe.rgba.exec(r))
      ? {r: t[1], g: t[2], b: t[3], a: t[4]}
      : (t = pe.hsl.exec(r))
        ? {h: t[1], s: t[2], l: t[3]}
        : (t = pe.hsla.exec(r))
          ? {h: t[1], s: t[2], l: t[3], a: t[4]}
          : (t = pe.hsv.exec(r))
            ? {h: t[1], s: t[2], v: t[3]}
            : (t = pe.hsva.exec(r))
              ? {h: t[1], s: t[2], v: t[3], a: t[4]}
              : (t = pe.hex8.exec(r))
                ? {r: ie(t[1]), g: ie(t[2]), b: ie(t[3]), a: Uf(t[4]), format: e ? 'name' : 'hex8'}
                : (t = pe.hex6.exec(r))
                  ? {r: ie(t[1]), g: ie(t[2]), b: ie(t[3]), format: e ? 'name' : 'hex'}
                  : (t = pe.hex4.exec(r))
                    ? {
                        r: ie(t[1] + '' + t[1]),
                        g: ie(t[2] + '' + t[2]),
                        b: ie(t[3] + '' + t[3]),
                        a: Uf(t[4] + '' + t[4]),
                        format: e ? 'name' : 'hex8',
                      }
                    : (t = pe.hex3.exec(r))
                      ? {
                          r: ie(t[1] + '' + t[1]),
                          g: ie(t[2] + '' + t[2]),
                          b: ie(t[3] + '' + t[3]),
                          format: e ? 'name' : 'hex',
                        }
                      : !1
}
function ty(r) {
  var e, t
  return (
    (r = r || {level: 'AA', size: 'small'}),
    (e = (r.level || 'AA').toUpperCase()),
    (t = (r.size || 'small').toLowerCase()),
    e !== 'AA' && e !== 'AAA' && (e = 'AA'),
    t !== 'small' && t !== 'large' && (t = 'small'),
    {level: e, size: t}
  )
}
var zf = function (e) {
    var t = ['r', 'g', 'b', 'a', 'h', 's', 'l', 'v'],
      n = 0,
      a = 0
    return (
      qb(t, function (i) {
        if (e[i] && ((n += 1), isNaN(e[i]) || (a += 1), i === 's' || i === 'l')) {
          var o = /^\d+%$/
          o.test(e[i]) && (a += 1)
        }
      }),
      n === a ? e : !1
    )
  },
  kr = function (e, t) {
    var n = e.hex ? F(e.hex) : F(e),
      a = n.toHsl(),
      i = n.toHsv(),
      o = n.toRgb(),
      s = n.toHex()
    a.s === 0 && ((a.h = t || 0), (i.h = t || 0))
    var u = s === '000000' && o.a === 0
    return {
      hsl: a,
      hex: u ? 'transparent' : '#' + s,
      rgb: o,
      hsv: i,
      oldHue: e.h || t || a.h,
      source: e.source,
    }
  },
  Pe = function (e) {
    if (e === 'transparent') return !0
    var t = String(e).charAt(0) === '#' ? 1 : 0
    return e.length !== 4 + t && e.length < 7 + t && F(e).isValid()
  },
  Ko = function (e) {
    if (!e) return '#fff'
    var t = kr(e)
    if (t.hex === 'transparent') return 'rgba(0,0,0,0.4)'
    var n = (t.rgb.r * 299 + t.rgb.g * 587 + t.rgb.b * 114) / 1e3
    return n >= 128 ? '#000' : '#fff'
  },
  $i = function (e, t) {
    var n = e.replace('°', '')
    return F(t + ' (' + n + ')')._ok
  },
  Er =
    Object.assign ||
    function (r) {
      for (var e = 1; e < arguments.length; e++) {
        var t = arguments[e]
        for (var n in t) Object.prototype.hasOwnProperty.call(t, n) && (r[n] = t[n])
      }
      return r
    },
  ny = (function () {
    function r(e, t) {
      for (var n = 0; n < t.length; n++) {
        var a = t[n]
        ;((a.enumerable = a.enumerable || !1),
          (a.configurable = !0),
          'value' in a && (a.writable = !0),
          Object.defineProperty(e, a.key, a))
      }
    }
    return function (e, t, n) {
      return (t && r(e.prototype, t), n && r(e, n), e)
    }
  })()
function ay(r, e) {
  if (!(r instanceof e)) throw new TypeError('Cannot call a class as a function')
}
function iy(r, e) {
  if (!r) throw new ReferenceError("this hasn't been initialised - super() hasn't been called")
  return e && (typeof e == 'object' || typeof e == 'function') ? e : r
}
function oy(r, e) {
  if (typeof e != 'function' && e !== null)
    throw new TypeError('Super expression must either be null or a function, not ' + typeof e)
  ;((r.prototype = Object.create(e && e.prototype, {
    constructor: {value: r, enumerable: !1, writable: !0, configurable: !0},
  })),
    e && (Object.setPrototypeOf ? Object.setPrototypeOf(r, e) : (r.__proto__ = e)))
}
var Q = function (e) {
    var t = (function (n) {
      oy(a, n)
      function a(i) {
        ay(this, a)
        var o = iy(this, (a.__proto__ || Object.getPrototypeOf(a)).call(this))
        return (
          (o.handleChange = function (s, u) {
            var l = zf(s)
            if (l) {
              var f = kr(s, s.h || o.state.oldHue)
              ;(o.setState(f),
                o.props.onChangeComplete && o.debounce(o.props.onChangeComplete, f, u),
                o.props.onChange && o.props.onChange(f, u))
            }
          }),
          (o.handleSwatchHover = function (s, u) {
            var l = zf(s)
            if (l) {
              var f = kr(s, s.h || o.state.oldHue)
              o.props.onSwatchHover && o.props.onSwatchHover(f, u)
            }
          }),
          (o.state = Er({}, kr(i.color, 0))),
          (o.debounce = zh(function (s, u, l) {
            s(u, l)
          }, 100)),
          o
        )
      }
      return (
        ny(
          a,
          [
            {
              key: 'render',
              value: function () {
                var o = {}
                return (
                  this.props.onSwatchHover && (o.onSwatchHover = this.handleSwatchHover),
                  p.createElement(
                    e,
                    Er({}, this.props, this.state, {onChange: this.handleChange}, o),
                  )
                )
              },
            },
          ],
          [
            {
              key: 'getDerivedStateFromProps',
              value: function (o, s) {
                return Er({}, kr(o.color, s.oldHue))
              },
            },
          ],
        ),
        a
      )
    })(Br || jr)
    return (
      (t.propTypes = Er({}, e.propTypes)),
      (t.defaultProps = Er({}, e.defaultProps, {color: {h: 250, s: 0.5, l: 0.2, a: 1}})),
      t
    )
  },
  sy =
    Object.assign ||
    function (r) {
      for (var e = 1; e < arguments.length; e++) {
        var t = arguments[e]
        for (var n in t) Object.prototype.hasOwnProperty.call(t, n) && (r[n] = t[n])
      }
      return r
    },
  uy = (function () {
    function r(e, t) {
      for (var n = 0; n < t.length; n++) {
        var a = t[n]
        ;((a.enumerable = a.enumerable || !1),
          (a.configurable = !0),
          'value' in a && (a.writable = !0),
          Object.defineProperty(e, a.key, a))
      }
    }
    return function (e, t, n) {
      return (t && r(e.prototype, t), n && r(e, n), e)
    }
  })()
function ly(r, e) {
  if (!(r instanceof e)) throw new TypeError('Cannot call a class as a function')
}
function Wf(r, e) {
  if (!r) throw new ReferenceError("this hasn't been initialised - super() hasn't been called")
  return e && (typeof e == 'object' || typeof e == 'function') ? e : r
}
function fy(r, e) {
  if (typeof e != 'function' && e !== null)
    throw new TypeError('Super expression must either be null or a function, not ' + typeof e)
  ;((r.prototype = Object.create(e && e.prototype, {
    constructor: {value: r, enumerable: !1, writable: !0, configurable: !0},
  })),
    e && (Object.setPrototypeOf ? Object.setPrototypeOf(r, e) : (r.__proto__ = e)))
}
var cy = function (e) {
    var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 'span'
    return (function (n) {
      fy(a, n)
      function a() {
        var i, o, s, u
        ly(this, a)
        for (var l = arguments.length, f = Array(l), c = 0; c < l; c++) f[c] = arguments[c]
        return (
          (u =
            ((o =
              ((s = Wf(
                this,
                (i = a.__proto__ || Object.getPrototypeOf(a)).call.apply(i, [this].concat(f)),
              )),
              s)),
            (s.state = {focus: !1}),
            (s.handleFocus = function () {
              return s.setState({focus: !0})
            }),
            (s.handleBlur = function () {
              return s.setState({focus: !1})
            }),
            o)),
          Wf(s, u)
        )
      }
      return (
        uy(a, [
          {
            key: 'render',
            value: function () {
              return p.createElement(
                t,
                {onFocus: this.handleFocus, onBlur: this.handleBlur},
                p.createElement(e, sy({}, this.props, this.state)),
              )
            },
          },
        ]),
        a
      )
    })(p.Component)
  },
  Kf =
    Object.assign ||
    function (r) {
      for (var e = 1; e < arguments.length; e++) {
        var t = arguments[e]
        for (var n in t) Object.prototype.hasOwnProperty.call(t, n) && (r[n] = t[n])
      }
      return r
    },
  hy = 13,
  py = function (e) {
    var t = e.color,
      n = e.style,
      a = e.onClick,
      i = a === void 0 ? function () {} : a,
      o = e.onHover,
      s = e.title,
      u = s === void 0 ? t : s,
      l = e.children,
      f = e.focus,
      c = e.focusStyle,
      h = c === void 0 ? {} : c,
      d = t === 'transparent',
      g = L({
        default: {
          swatch: Kf(
            {
              background: t,
              height: '100%',
              width: '100%',
              cursor: 'pointer',
              position: 'relative',
              outline: 'none',
            },
            n,
            f ? h : {},
          ),
        },
      }),
      v = function (S) {
        return i(t, S)
      },
      b = function (S) {
        return S.keyCode === hy && i(t, S)
      },
      w = function (S) {
        return o(t, S)
      },
      _ = {}
    return (
      o && (_.onMouseOver = w),
      p.createElement(
        'div',
        Kf({style: g.swatch, onClick: v, title: u, tabIndex: 0, onKeyDown: b}, _),
        l,
        d &&
          p.createElement(xr, {
            borderRadius: g.swatch.borderRadius,
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
          }),
      )
    )
  }
const je = cy(py)
var dy = function (e) {
    var t = e.direction,
      n = L(
        {
          default: {
            picker: {
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              transform: 'translate(-9px, -1px)',
              backgroundColor: 'rgb(248, 248, 248)',
              boxShadow: '0 1px 4px 0 rgba(0, 0, 0, 0.37)',
            },
          },
          vertical: {picker: {transform: 'translate(-3px, -9px)'}},
        },
        {vertical: t === 'vertical'},
      )
    return p.createElement('div', {style: n.picker})
  },
  gy =
    Object.assign ||
    function (r) {
      for (var e = 1; e < arguments.length; e++) {
        var t = arguments[e]
        for (var n in t) Object.prototype.hasOwnProperty.call(t, n) && (r[n] = t[n])
      }
      return r
    },
  Xh = function (e) {
    var t = e.rgb,
      n = e.hsl,
      a = e.width,
      i = e.height,
      o = e.onChange,
      s = e.direction,
      u = e.style,
      l = e.renderers,
      f = e.pointer,
      c = e.className,
      h = c === void 0 ? '' : c,
      d = L({
        default: {
          picker: {position: 'relative', width: a, height: i},
          alpha: {radius: '2px', style: u},
        },
      })
    return p.createElement(
      'div',
      {style: d.picker, className: 'alpha-picker ' + h},
      p.createElement(
        Bo,
        gy({}, d.alpha, {rgb: t, hsl: n, pointer: f, renderers: l, onChange: o, direction: s}),
      ),
    )
  }
Xh.defaultProps = {width: '316px', height: '16px', direction: 'horizontal', pointer: dy}
Q(Xh)
function Yh(r, e) {
  for (var t = -1, n = r == null ? 0 : r.length, a = Array(n); ++t < n; ) a[t] = e(r[t], t, r)
  return a
}
var vy = '__lodash_hash_undefined__'
function by(r) {
  return (this.__data__.set(r, vy), this)
}
function yy(r) {
  return this.__data__.has(r)
}
function gt(r) {
  var e = -1,
    t = r == null ? 0 : r.length
  for (this.__data__ = new Se(); ++e < t; ) this.add(r[e])
}
gt.prototype.add = gt.prototype.push = by
gt.prototype.has = yy
function my(r, e) {
  for (var t = -1, n = r == null ? 0 : r.length; ++t < n; ) if (e(r[t], t, r)) return !0
  return !1
}
function xy(r, e) {
  return r.has(e)
}
var _y = 1,
  wy = 2
function Zh(r, e, t, n, a, i) {
  var o = t & _y,
    s = r.length,
    u = e.length
  if (s != u && !(o && u > s)) return !1
  var l = i.get(r),
    f = i.get(e)
  if (l && f) return l == e && f == r
  var c = -1,
    h = !0,
    d = t & wy ? new gt() : void 0
  for (i.set(r, e), i.set(e, r); ++c < s; ) {
    var g = r[c],
      v = e[c]
    if (n) var b = o ? n(v, g, c, e, r, i) : n(g, v, c, r, e, i)
    if (b !== void 0) {
      if (b) continue
      h = !1
      break
    }
    if (d) {
      if (
        !my(e, function (w, _) {
          if (!xy(d, _) && (g === w || a(g, w, t, n, i))) return d.push(_)
        })
      ) {
        h = !1
        break
      }
    } else if (!(g === v || a(g, v, t, n, i))) {
      h = !1
      break
    }
  }
  return (i.delete(r), i.delete(e), h)
}
function Sy(r) {
  var e = -1,
    t = Array(r.size)
  return (
    r.forEach(function (n, a) {
      t[++e] = [a, n]
    }),
    t
  )
}
function Cy(r) {
  var e = -1,
    t = Array(r.size)
  return (
    r.forEach(function (n) {
      t[++e] = n
    }),
    t
  )
}
var Ey = 1,
  Ry = 2,
  Oy = '[object Boolean]',
  Ay = '[object Date]',
  Ty = '[object Error]',
  My = '[object Map]',
  Py = '[object Number]',
  qy = '[object RegExp]',
  ky = '[object Set]',
  Iy = '[object String]',
  Fy = '[object Symbol]',
  Hy = '[object ArrayBuffer]',
  Dy = '[object DataView]',
  Vf = Ae ? Ae.prototype : void 0,
  Ni = Vf ? Vf.valueOf : void 0
function Ly(r, e, t, n, a, i, o) {
  switch (t) {
    case Dy:
      if (r.byteLength != e.byteLength || r.byteOffset != e.byteOffset) return !1
      ;((r = r.buffer), (e = e.buffer))
    case Hy:
      return !(r.byteLength != e.byteLength || !i(new ct(r), new ct(e)))
    case Oy:
    case Ay:
    case Py:
      return Kr(+r, +e)
    case Ty:
      return r.name == e.name && r.message == e.message
    case qy:
    case Iy:
      return r == e + ''
    case My:
      var s = Sy
    case ky:
      var u = n & Ey
      if ((s || (s = Cy), r.size != e.size && !u)) return !1
      var l = o.get(r)
      if (l) return l == e
      ;((n |= Ry), o.set(r, e))
      var f = Zh(s(r), s(e), n, a, i, o)
      return (o.delete(r), f)
    case Fy:
      if (Ni) return Ni.call(r) == Ni.call(e)
  }
  return !1
}
function By(r, e) {
  for (var t = -1, n = e.length, a = r.length; ++t < n; ) r[a + t] = e[t]
  return r
}
function jy(r, e, t) {
  var n = e(r)
  return oe(r) ? n : By(n, t(r))
}
function $y(r, e) {
  for (var t = -1, n = r == null ? 0 : r.length, a = 0, i = []; ++t < n; ) {
    var o = r[t]
    e(o, t, r) && (i[a++] = o)
  }
  return i
}
function Ny() {
  return []
}
var Gy = Object.prototype,
  Uy = Gy.propertyIsEnumerable,
  Xf = Object.getOwnPropertySymbols,
  zy = Xf
    ? function (r) {
        return r == null
          ? []
          : ((r = Object(r)),
            $y(Xf(r), function (e) {
              return Uy.call(r, e)
            }))
      }
    : Ny
function Yf(r) {
  return jy(r, Wo, zy)
}
var Wy = 1,
  Ky = Object.prototype,
  Vy = Ky.hasOwnProperty
function Xy(r, e, t, n, a, i) {
  var o = t & Wy,
    s = Yf(r),
    u = s.length,
    l = Yf(e),
    f = l.length
  if (u != f && !o) return !1
  for (var c = u; c--; ) {
    var h = s[c]
    if (!(o ? h in e : Vy.call(e, h))) return !1
  }
  var d = i.get(r),
    g = i.get(e)
  if (d && g) return d == e && g == r
  var v = !0
  ;(i.set(r, e), i.set(e, r))
  for (var b = o; ++c < u; ) {
    h = s[c]
    var w = r[h],
      _ = e[h]
    if (n) var C = o ? n(_, w, h, e, r, i) : n(w, _, h, r, e, i)
    if (!(C === void 0 ? w === _ || a(w, _, t, n, i) : C)) {
      v = !1
      break
    }
    b || (b = h == 'constructor')
  }
  if (v && !b) {
    var S = r.constructor,
      E = e.constructor
    S != E &&
      'constructor' in r &&
      'constructor' in e &&
      !(typeof S == 'function' && S instanceof S && typeof E == 'function' && E instanceof E) &&
      (v = !1)
  }
  return (i.delete(r), i.delete(e), v)
}
var yo = Be(ve, 'DataView'),
  mo = Be(ve, 'Promise'),
  xo = Be(ve, 'Set'),
  _o = Be(ve, 'WeakMap'),
  Zf = '[object Map]',
  Yy = '[object Object]',
  Jf = '[object Promise]',
  Qf = '[object Set]',
  ec = '[object WeakMap]',
  rc = '[object DataView]',
  Zy = Le(yo),
  Jy = Le(Dr),
  Qy = Le(mo),
  em = Le(xo),
  rm = Le(_o),
  Re = De
;((yo && Re(new yo(new ArrayBuffer(1))) != rc) ||
  (Dr && Re(new Dr()) != Zf) ||
  (mo && Re(mo.resolve()) != Jf) ||
  (xo && Re(new xo()) != Qf) ||
  (_o && Re(new _o()) != ec)) &&
  (Re = function (r) {
    var e = De(r),
      t = e == Yy ? r.constructor : void 0,
      n = t ? Le(t) : ''
    if (n)
      switch (n) {
        case Zy:
          return rc
        case Jy:
          return Zf
        case Qy:
          return Jf
        case em:
          return Qf
        case rm:
          return ec
      }
    return e
  })
var tm = 1,
  tc = '[object Arguments]',
  nc = '[object Array]',
  nt = '[object Object]',
  nm = Object.prototype,
  ac = nm.hasOwnProperty
function am(r, e, t, n, a, i) {
  var o = oe(r),
    s = oe(e),
    u = o ? nc : Re(r),
    l = s ? nc : Re(e)
  ;((u = u == tc ? nt : u), (l = l == tc ? nt : l))
  var f = u == nt,
    c = l == nt,
    h = u == l
  if (h && pt(r)) {
    if (!pt(e)) return !1
    ;((o = !0), (f = !1))
  }
  if (h && !f)
    return (i || (i = new ye()), o || Uo(r) ? Zh(r, e, t, n, a, i) : Ly(r, e, u, t, n, a, i))
  if (!(t & tm)) {
    var d = f && ac.call(r, '__wrapped__'),
      g = c && ac.call(e, '__wrapped__')
    if (d || g) {
      var v = d ? r.value() : r,
        b = g ? e.value() : e
      return (i || (i = new ye()), a(v, b, t, n, i))
    }
  }
  return h ? (i || (i = new ye()), Xy(r, e, t, n, a, i)) : !1
}
function Vo(r, e, t, n, a) {
  return r === e
    ? !0
    : r == null || e == null || (!Te(r) && !Te(e))
      ? r !== r && e !== e
      : am(r, e, t, n, Vo, a)
}
var im = 1,
  om = 2
function sm(r, e, t, n) {
  var a = t.length,
    i = a
  if (r == null) return !i
  for (r = Object(r); a--; ) {
    var o = t[a]
    if (o[2] ? o[1] !== r[o[0]] : !(o[0] in r)) return !1
  }
  for (; ++a < i; ) {
    o = t[a]
    var s = o[0],
      u = r[s],
      l = o[1]
    if (o[2]) {
      if (u === void 0 && !(s in r)) return !1
    } else {
      var f = new ye(),
        c
      if (!(c === void 0 ? Vo(l, u, im | om, n, f) : c)) return !1
    }
  }
  return !0
}
function Jh(r) {
  return r === r && !le(r)
}
function um(r) {
  for (var e = Wo(r), t = e.length; t--; ) {
    var n = e[t],
      a = r[n]
    e[t] = [n, a, Jh(a)]
  }
  return e
}
function Qh(r, e) {
  return function (t) {
    return t == null ? !1 : t[r] === e && (e !== void 0 || r in Object(t))
  }
}
function lm(r) {
  var e = um(r)
  return e.length == 1 && e[0][2]
    ? Qh(e[0][0], e[0][1])
    : function (t) {
        return t === r || sm(t, r, e)
      }
}
var fm = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
  cm = /^\w*$/
function Xo(r, e) {
  if (oe(r)) return !1
  var t = typeof r
  return t == 'number' || t == 'symbol' || t == 'boolean' || r == null || Pt(r)
    ? !0
    : cm.test(r) || !fm.test(r) || (e != null && r in Object(e))
}
var hm = 'Expected a function'
function Yo(r, e) {
  if (typeof r != 'function' || (e != null && typeof e != 'function')) throw new TypeError(hm)
  var t = function () {
    var n = arguments,
      a = e ? e.apply(this, n) : n[0],
      i = t.cache
    if (i.has(a)) return i.get(a)
    var o = r.apply(this, n)
    return ((t.cache = i.set(a, o) || i), o)
  }
  return ((t.cache = new (Yo.Cache || Se)()), t)
}
Yo.Cache = Se
var pm = 500
function dm(r) {
  var e = Yo(r, function (n) {
      return (t.size === pm && t.clear(), n)
    }),
    t = e.cache
  return e
}
var gm =
    /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,
  vm = /\\(\\)?/g,
  bm = dm(function (r) {
    var e = []
    return (
      r.charCodeAt(0) === 46 && e.push(''),
      r.replace(gm, function (t, n, a, i) {
        e.push(a ? i.replace(vm, '$1') : n || t)
      }),
      e
    )
  }),
  ic = Ae ? Ae.prototype : void 0,
  oc = ic ? ic.toString : void 0
function ep(r) {
  if (typeof r == 'string') return r
  if (oe(r)) return Yh(r, ep) + ''
  if (Pt(r)) return oc ? oc.call(r) : ''
  var e = r + ''
  return e == '0' && 1 / r == -1 / 0 ? '-0' : e
}
function ym(r) {
  return r == null ? '' : ep(r)
}
function rp(r, e) {
  return oe(r) ? r : Xo(r, e) ? [r] : bm(ym(r))
}
function It(r) {
  if (typeof r == 'string' || Pt(r)) return r
  var e = r + ''
  return e == '0' && 1 / r == -1 / 0 ? '-0' : e
}
function tp(r, e) {
  e = rp(e, r)
  for (var t = 0, n = e.length; r != null && t < n; ) r = r[It(e[t++])]
  return t && t == n ? r : void 0
}
function mm(r, e, t) {
  var n = r == null ? void 0 : tp(r, e)
  return n === void 0 ? t : n
}
function xm(r, e) {
  return r != null && e in Object(r)
}
function _m(r, e, t) {
  e = rp(e, r)
  for (var n = -1, a = e.length, i = !1; ++n < a; ) {
    var o = It(e[n])
    if (!(i = r != null && t(r, o))) break
    r = r[o]
  }
  return i || ++n != a
    ? i
    : ((a = r == null ? 0 : r.length), !!a && Go(a) && zo(o, a) && (oe(r) || ht(r)))
}
function wm(r, e) {
  return r != null && _m(r, e, xm)
}
var Sm = 1,
  Cm = 2
function Em(r, e) {
  return Xo(r) && Jh(e)
    ? Qh(It(r), e)
    : function (t) {
        var n = mm(t, r)
        return n === void 0 && n === e ? wm(t, r) : Vo(e, n, Sm | Cm)
      }
}
function Rm(r) {
  return function (e) {
    return e?.[r]
  }
}
function Om(r) {
  return function (e) {
    return tp(e, r)
  }
}
function Am(r) {
  return Xo(r) ? Rm(It(r)) : Om(r)
}
function Tm(r) {
  return typeof r == 'function'
    ? r
    : r == null
      ? Mt
      : typeof r == 'object'
        ? oe(r)
          ? Em(r[0], r[1])
          : lm(r)
        : Am(r)
}
function Mm(r, e) {
  var t = -1,
    n = wr(r) ? Array(r.length) : []
  return (
    Wh(r, function (a, i, o) {
      n[++t] = e(a, i, o)
    }),
    n
  )
}
function $e(r, e) {
  var t = oe(r) ? Yh : Mm
  return t(r, Tm(e))
}
var Pm = function (e) {
    var t = e.colors,
      n = e.onClick,
      a = e.onSwatchHover,
      i = L({
        default: {
          swatches: {marginRight: '-10px'},
          swatch: {
            width: '22px',
            height: '22px',
            float: 'left',
            marginRight: '10px',
            marginBottom: '10px',
            borderRadius: '4px',
          },
          clear: {clear: 'both'},
        },
      })
    return p.createElement(
      'div',
      {style: i.swatches},
      $e(t, function (o) {
        return p.createElement(je, {
          key: o,
          color: o,
          style: i.swatch,
          onClick: n,
          onHover: a,
          focusStyle: {boxShadow: '0 0 4px ' + o},
        })
      }),
      p.createElement('div', {style: i.clear}),
    )
  },
  Zo = function (e) {
    var t = e.onChange,
      n = e.onSwatchHover,
      a = e.hex,
      i = e.colors,
      o = e.width,
      s = e.triangle,
      u = e.styles,
      l = u === void 0 ? {} : u,
      f = e.className,
      c = f === void 0 ? '' : f,
      h = a === 'transparent',
      d = function (b, w) {
        Pe(b) && t({hex: b, source: 'hex'}, w)
      },
      g = L(
        te(
          {
            default: {
              card: {
                width: o,
                background: '#fff',
                boxShadow: '0 1px rgba(0,0,0,.1)',
                borderRadius: '6px',
                position: 'relative',
              },
              head: {
                height: '110px',
                background: a,
                borderRadius: '6px 6px 0 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              },
              body: {padding: '10px'},
              label: {fontSize: '18px', color: Ko(a), position: 'relative'},
              triangle: {
                width: '0px',
                height: '0px',
                borderStyle: 'solid',
                borderWidth: '0 10px 10px 10px',
                borderColor: 'transparent transparent ' + a + ' transparent',
                position: 'absolute',
                top: '-10px',
                left: '50%',
                marginLeft: '-10px',
              },
              input: {
                width: '100%',
                fontSize: '12px',
                color: '#666',
                border: '0px',
                outline: 'none',
                height: '22px',
                boxShadow: 'inset 0 0 0 1px #ddd',
                borderRadius: '4px',
                padding: '0 7px',
                boxSizing: 'border-box',
              },
            },
            'hide-triangle': {triangle: {display: 'none'}},
          },
          l,
        ),
        {'hide-triangle': s === 'hide'},
      )
    return p.createElement(
      'div',
      {style: g.card, className: 'block-picker ' + c},
      p.createElement('div', {style: g.triangle}),
      p.createElement(
        'div',
        {style: g.head},
        h && p.createElement(xr, {borderRadius: '6px 6px 0 0'}),
        p.createElement('div', {style: g.label}, a),
      ),
      p.createElement(
        'div',
        {style: g.body},
        p.createElement(Pm, {colors: i, onClick: d, onSwatchHover: n}),
        p.createElement(U, {style: {input: g.input}, value: a, onChange: d}),
      ),
    )
  }
Zo.propTypes = {
  width: P.oneOfType([P.string, P.number]),
  colors: P.arrayOf(P.string),
  triangle: P.oneOf(['top', 'hide']),
  styles: P.object,
}
Zo.defaultProps = {
  width: 170,
  colors: [
    '#D9E3F0',
    '#F47373',
    '#697689',
    '#37D67A',
    '#2CCCE4',
    '#555555',
    '#dce775',
    '#ff8a65',
    '#ba68c8',
  ],
  triangle: 'top',
  styles: {},
}
Q(Zo)
var tr = {100: '#ffcdd2', 300: '#e57373', 500: '#f44336', 700: '#d32f2f', 900: '#b71c1c'},
  nr = {100: '#f8bbd0', 300: '#f06292', 500: '#e91e63', 700: '#c2185b', 900: '#880e4f'},
  ar = {100: '#e1bee7', 300: '#ba68c8', 500: '#9c27b0', 700: '#7b1fa2', 900: '#4a148c'},
  ir = {100: '#d1c4e9', 300: '#9575cd', 500: '#673ab7', 700: '#512da8', 900: '#311b92'},
  or = {100: '#c5cae9', 300: '#7986cb', 500: '#3f51b5', 700: '#303f9f', 900: '#1a237e'},
  sr = {100: '#bbdefb', 300: '#64b5f6', 500: '#2196f3', 700: '#1976d2', 900: '#0d47a1'},
  ur = {100: '#b3e5fc', 300: '#4fc3f7', 500: '#03a9f4', 700: '#0288d1', 900: '#01579b'},
  lr = {100: '#b2ebf2', 300: '#4dd0e1', 500: '#00bcd4', 700: '#0097a7', 900: '#006064'},
  fr = {100: '#b2dfdb', 300: '#4db6ac', 500: '#009688', 700: '#00796b', 900: '#004d40'},
  Ir = {100: '#c8e6c9', 300: '#81c784', 500: '#4caf50', 700: '#388e3c'},
  cr = {100: '#dcedc8', 300: '#aed581', 500: '#8bc34a', 700: '#689f38', 900: '#33691e'},
  hr = {100: '#f0f4c3', 300: '#dce775', 500: '#cddc39', 700: '#afb42b', 900: '#827717'},
  pr = {100: '#fff9c4', 300: '#fff176', 500: '#ffeb3b', 700: '#fbc02d', 900: '#f57f17'},
  dr = {100: '#ffecb3', 300: '#ffd54f', 500: '#ffc107', 700: '#ffa000', 900: '#ff6f00'},
  gr = {100: '#ffe0b2', 300: '#ffb74d', 500: '#ff9800', 700: '#f57c00', 900: '#e65100'},
  vr = {100: '#ffccbc', 300: '#ff8a65', 500: '#ff5722', 700: '#e64a19', 900: '#bf360c'},
  br = {100: '#d7ccc8', 300: '#a1887f', 500: '#795548', 700: '#5d4037', 900: '#3e2723'},
  yr = {100: '#cfd8dc', 300: '#90a4ae', 500: '#607d8b', 700: '#455a64', 900: '#263238'},
  np = function (e) {
    var t = e.color,
      n = e.onClick,
      a = e.onSwatchHover,
      i = e.hover,
      o = e.active,
      s = e.circleSize,
      u = e.circleSpacing,
      l = L(
        {
          default: {
            swatch: {
              width: s,
              height: s,
              marginRight: u,
              marginBottom: u,
              transform: 'scale(1)',
              transition: '100ms transform ease',
            },
            Swatch: {
              borderRadius: '50%',
              background: 'transparent',
              boxShadow: 'inset 0 0 0 ' + (s / 2 + 1) + 'px ' + t,
              transition: '100ms box-shadow ease',
            },
          },
          hover: {swatch: {transform: 'scale(1.2)'}},
          active: {Swatch: {boxShadow: 'inset 0 0 0 3px ' + t}},
        },
        {hover: i, active: o},
      )
    return p.createElement(
      'div',
      {style: l.swatch},
      p.createElement(je, {
        style: l.Swatch,
        color: t,
        onClick: n,
        onHover: a,
        focusStyle: {boxShadow: l.Swatch.boxShadow + ', 0 0 5px ' + t},
      }),
    )
  }
np.defaultProps = {circleSize: 28, circleSpacing: 14}
const qm = Lo.handleHover(np)
var Jo = function (e) {
  var t = e.width,
    n = e.onChange,
    a = e.onSwatchHover,
    i = e.colors,
    o = e.hex,
    s = e.circleSize,
    u = e.styles,
    l = u === void 0 ? {} : u,
    f = e.circleSpacing,
    c = e.className,
    h = c === void 0 ? '' : c,
    d = L(
      te(
        {
          default: {
            card: {width: t, display: 'flex', flexWrap: 'wrap', marginRight: -f, marginBottom: -f},
          },
        },
        l,
      ),
    ),
    g = function (b, w) {
      return n({hex: b, source: 'hex'}, w)
    }
  return p.createElement(
    'div',
    {style: d.card, className: 'circle-picker ' + h},
    $e(i, function (v) {
      return p.createElement(qm, {
        key: v,
        color: v,
        onClick: g,
        onSwatchHover: a,
        active: o === v.toLowerCase(),
        circleSize: s,
        circleSpacing: f,
      })
    }),
  )
}
Jo.propTypes = {
  width: P.oneOfType([P.string, P.number]),
  circleSize: P.number,
  circleSpacing: P.number,
  styles: P.object,
}
Jo.defaultProps = {
  width: 252,
  circleSize: 28,
  circleSpacing: 14,
  colors: [
    tr[500],
    nr[500],
    ar[500],
    ir[500],
    or[500],
    sr[500],
    ur[500],
    lr[500],
    fr[500],
    Ir[500],
    cr[500],
    hr[500],
    pr[500],
    dr[500],
    gr[500],
    vr[500],
    br[500],
    yr[500],
  ],
  styles: {},
}
Q(Jo)
function sc(r) {
  return r === void 0
}
var at = {},
  uc
function km() {
  if (uc) return at
  ;((uc = 1), Object.defineProperty(at, '__esModule', {value: !0}))
  var r =
      Object.assign ||
      function (o) {
        for (var s = 1; s < arguments.length; s++) {
          var u = arguments[s]
          for (var l in u) Object.prototype.hasOwnProperty.call(u, l) && (o[l] = u[l])
        }
        return o
      },
    e = p,
    t = n(e)
  function n(o) {
    return o && o.__esModule ? o : {default: o}
  }
  function a(o, s) {
    var u = {}
    for (var l in o)
      s.indexOf(l) >= 0 || (Object.prototype.hasOwnProperty.call(o, l) && (u[l] = o[l]))
    return u
  }
  var i = 24
  return (
    (at.default = function (o) {
      var s = o.fill,
        u = s === void 0 ? 'currentColor' : s,
        l = o.width,
        f = l === void 0 ? i : l,
        c = o.height,
        h = c === void 0 ? i : c,
        d = o.style,
        g = d === void 0 ? {} : d,
        v = a(o, ['fill', 'width', 'height', 'style'])
      return t.default.createElement(
        'svg',
        r({viewBox: '0 0 ' + i + ' ' + i, style: r({fill: u, width: f, height: h}, g)}, v),
        t.default.createElement('path', {
          d: 'M12,18.17L8.83,15L7.42,16.41L12,21L16.59,16.41L15.17,15M12,5.83L15.17,9L16.58,7.59L12,3L7.41,7.59L8.83,9L12,5.83Z',
        }),
      )
    }),
    at
  )
}
var Im = km()
const Fm = bt(Im)
var Hm = (function () {
  function r(e, t) {
    for (var n = 0; n < t.length; n++) {
      var a = t[n]
      ;((a.enumerable = a.enumerable || !1),
        (a.configurable = !0),
        'value' in a && (a.writable = !0),
        Object.defineProperty(e, a.key, a))
    }
  }
  return function (e, t, n) {
    return (t && r(e.prototype, t), n && r(e, n), e)
  }
})()
function Dm(r, e) {
  if (!(r instanceof e)) throw new TypeError('Cannot call a class as a function')
}
function Lm(r, e) {
  if (!r) throw new ReferenceError("this hasn't been initialised - super() hasn't been called")
  return e && (typeof e == 'object' || typeof e == 'function') ? e : r
}
function Bm(r, e) {
  if (typeof e != 'function' && e !== null)
    throw new TypeError('Super expression must either be null or a function, not ' + typeof e)
  ;((r.prototype = Object.create(e && e.prototype, {
    constructor: {value: r, enumerable: !1, writable: !0, configurable: !0},
  })),
    e && (Object.setPrototypeOf ? Object.setPrototypeOf(r, e) : (r.__proto__ = e)))
}
var ap = (function (r) {
  Bm(e, r)
  function e(t) {
    Dm(this, e)
    var n = Lm(this, (e.__proto__ || Object.getPrototypeOf(e)).call(this))
    return (
      (n.toggleViews = function () {
        n.state.view === 'hex'
          ? n.setState({view: 'rgb'})
          : n.state.view === 'rgb'
            ? n.setState({view: 'hsl'})
            : n.state.view === 'hsl' &&
              (n.props.hsl.a === 1 ? n.setState({view: 'hex'}) : n.setState({view: 'rgb'}))
      }),
      (n.handleChange = function (a, i) {
        a.hex
          ? Pe(a.hex) && n.props.onChange({hex: a.hex, source: 'hex'}, i)
          : a.r || a.g || a.b
            ? n.props.onChange(
                {
                  r: a.r || n.props.rgb.r,
                  g: a.g || n.props.rgb.g,
                  b: a.b || n.props.rgb.b,
                  source: 'rgb',
                },
                i,
              )
            : a.a
              ? (a.a < 0 ? (a.a = 0) : a.a > 1 && (a.a = 1),
                n.props.onChange(
                  {
                    h: n.props.hsl.h,
                    s: n.props.hsl.s,
                    l: n.props.hsl.l,
                    a: Math.round(a.a * 100) / 100,
                    source: 'rgb',
                  },
                  i,
                ))
              : (a.h || a.s || a.l) &&
                (typeof a.s == 'string' && a.s.includes('%') && (a.s = a.s.replace('%', '')),
                typeof a.l == 'string' && a.l.includes('%') && (a.l = a.l.replace('%', '')),
                a.s == 1 ? (a.s = 0.01) : a.l == 1 && (a.l = 0.01),
                n.props.onChange(
                  {
                    h: a.h || n.props.hsl.h,
                    s: Number(sc(a.s) ? n.props.hsl.s : a.s),
                    l: Number(sc(a.l) ? n.props.hsl.l : a.l),
                    source: 'hsl',
                  },
                  i,
                ))
      }),
      (n.showHighlight = function (a) {
        a.currentTarget.style.background = '#eee'
      }),
      (n.hideHighlight = function (a) {
        a.currentTarget.style.background = 'transparent'
      }),
      t.hsl.a !== 1 && t.view === 'hex' ? (n.state = {view: 'rgb'}) : (n.state = {view: t.view}),
      n
    )
  }
  return (
    Hm(
      e,
      [
        {
          key: 'render',
          value: function () {
            var n = this,
              a = L(
                {
                  default: {
                    wrap: {paddingTop: '16px', display: 'flex'},
                    fields: {flex: '1', display: 'flex', marginLeft: '-6px'},
                    field: {paddingLeft: '6px', width: '100%'},
                    alpha: {paddingLeft: '6px', width: '100%'},
                    toggle: {width: '32px', textAlign: 'right', position: 'relative'},
                    icon: {
                      marginRight: '-4px',
                      marginTop: '12px',
                      cursor: 'pointer',
                      position: 'relative',
                    },
                    iconHighlight: {
                      position: 'absolute',
                      width: '24px',
                      height: '28px',
                      background: '#eee',
                      borderRadius: '4px',
                      top: '10px',
                      left: '12px',
                      display: 'none',
                    },
                    input: {
                      fontSize: '11px',
                      color: '#333',
                      width: '100%',
                      borderRadius: '2px',
                      border: 'none',
                      boxShadow: 'inset 0 0 0 1px #dadada',
                      height: '21px',
                      textAlign: 'center',
                    },
                    label: {
                      textTransform: 'uppercase',
                      fontSize: '11px',
                      lineHeight: '11px',
                      color: '#969696',
                      textAlign: 'center',
                      display: 'block',
                      marginTop: '12px',
                    },
                    svg: {
                      fill: '#333',
                      width: '24px',
                      height: '24px',
                      border: '1px transparent solid',
                      borderRadius: '5px',
                    },
                  },
                  disableAlpha: {alpha: {display: 'none'}},
                },
                this.props,
                this.state,
              ),
              i = void 0
            return (
              this.state.view === 'hex'
                ? (i = p.createElement(
                    'div',
                    {style: a.fields, className: 'flexbox-fix'},
                    p.createElement(
                      'div',
                      {style: a.field},
                      p.createElement(U, {
                        style: {input: a.input, label: a.label},
                        label: 'hex',
                        value: this.props.hex,
                        onChange: this.handleChange,
                      }),
                    ),
                  ))
                : this.state.view === 'rgb'
                  ? (i = p.createElement(
                      'div',
                      {style: a.fields, className: 'flexbox-fix'},
                      p.createElement(
                        'div',
                        {style: a.field},
                        p.createElement(U, {
                          style: {input: a.input, label: a.label},
                          label: 'r',
                          value: this.props.rgb.r,
                          onChange: this.handleChange,
                        }),
                      ),
                      p.createElement(
                        'div',
                        {style: a.field},
                        p.createElement(U, {
                          style: {input: a.input, label: a.label},
                          label: 'g',
                          value: this.props.rgb.g,
                          onChange: this.handleChange,
                        }),
                      ),
                      p.createElement(
                        'div',
                        {style: a.field},
                        p.createElement(U, {
                          style: {input: a.input, label: a.label},
                          label: 'b',
                          value: this.props.rgb.b,
                          onChange: this.handleChange,
                        }),
                      ),
                      p.createElement(
                        'div',
                        {style: a.alpha},
                        p.createElement(U, {
                          style: {input: a.input, label: a.label},
                          label: 'a',
                          value: this.props.rgb.a,
                          arrowOffset: 0.01,
                          onChange: this.handleChange,
                        }),
                      ),
                    ))
                  : this.state.view === 'hsl' &&
                    (i = p.createElement(
                      'div',
                      {style: a.fields, className: 'flexbox-fix'},
                      p.createElement(
                        'div',
                        {style: a.field},
                        p.createElement(U, {
                          style: {input: a.input, label: a.label},
                          label: 'h',
                          value: Math.round(this.props.hsl.h),
                          onChange: this.handleChange,
                        }),
                      ),
                      p.createElement(
                        'div',
                        {style: a.field},
                        p.createElement(U, {
                          style: {input: a.input, label: a.label},
                          label: 's',
                          value: Math.round(this.props.hsl.s * 100) + '%',
                          onChange: this.handleChange,
                        }),
                      ),
                      p.createElement(
                        'div',
                        {style: a.field},
                        p.createElement(U, {
                          style: {input: a.input, label: a.label},
                          label: 'l',
                          value: Math.round(this.props.hsl.l * 100) + '%',
                          onChange: this.handleChange,
                        }),
                      ),
                      p.createElement(
                        'div',
                        {style: a.alpha},
                        p.createElement(U, {
                          style: {input: a.input, label: a.label},
                          label: 'a',
                          value: this.props.hsl.a,
                          arrowOffset: 0.01,
                          onChange: this.handleChange,
                        }),
                      ),
                    )),
              p.createElement(
                'div',
                {style: a.wrap, className: 'flexbox-fix'},
                i,
                p.createElement(
                  'div',
                  {style: a.toggle},
                  p.createElement(
                    'div',
                    {
                      style: a.icon,
                      onClick: this.toggleViews,
                      ref: function (s) {
                        return (n.icon = s)
                      },
                    },
                    p.createElement(Fm, {
                      style: a.svg,
                      onMouseOver: this.showHighlight,
                      onMouseEnter: this.showHighlight,
                      onMouseOut: this.hideHighlight,
                    }),
                  ),
                ),
              )
            )
          },
        },
      ],
      [
        {
          key: 'getDerivedStateFromProps',
          value: function (n, a) {
            return n.hsl.a !== 1 && a.view === 'hex' ? {view: 'rgb'} : null
          },
        },
      ],
    ),
    e
  )
})(p.Component)
ap.defaultProps = {view: 'hex'}
var lc = function () {
    var e = L({
      default: {
        picker: {
          width: '12px',
          height: '12px',
          borderRadius: '6px',
          transform: 'translate(-6px, -1px)',
          backgroundColor: 'rgb(248, 248, 248)',
          boxShadow: '0 1px 4px 0 rgba(0, 0, 0, 0.37)',
        },
      },
    })
    return p.createElement('div', {style: e.picker})
  },
  jm = function () {
    var e = L({
      default: {
        picker: {
          width: '12px',
          height: '12px',
          borderRadius: '6px',
          boxShadow: 'inset 0 0 0 1px #fff',
          transform: 'translate(-6px, -6px)',
        },
      },
    })
    return p.createElement('div', {style: e.picker})
  },
  Qo = function (e) {
    var t = e.width,
      n = e.onChange,
      a = e.disableAlpha,
      i = e.rgb,
      o = e.hsl,
      s = e.hsv,
      u = e.hex,
      l = e.renderers,
      f = e.styles,
      c = f === void 0 ? {} : f,
      h = e.className,
      d = h === void 0 ? '' : h,
      g = e.defaultView,
      v = L(
        te(
          {
            default: {
              picker: {
                width: t,
                background: '#fff',
                borderRadius: '2px',
                boxShadow: '0 0 2px rgba(0,0,0,.3), 0 4px 8px rgba(0,0,0,.3)',
                boxSizing: 'initial',
                fontFamily: 'Menlo',
              },
              saturation: {
                width: '100%',
                paddingBottom: '55%',
                position: 'relative',
                borderRadius: '2px 2px 0 0',
                overflow: 'hidden',
              },
              Saturation: {radius: '2px 2px 0 0'},
              body: {padding: '16px 16px 12px'},
              controls: {display: 'flex'},
              color: {width: '32px'},
              swatch: {
                marginTop: '6px',
                width: '16px',
                height: '16px',
                borderRadius: '8px',
                position: 'relative',
                overflow: 'hidden',
              },
              active: {
                absolute: '0px 0px 0px 0px',
                borderRadius: '8px',
                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.1)',
                background: 'rgba(' + i.r + ', ' + i.g + ', ' + i.b + ', ' + i.a + ')',
                zIndex: '2',
              },
              toggles: {flex: '1'},
              hue: {height: '10px', position: 'relative', marginBottom: '8px'},
              Hue: {radius: '2px'},
              alpha: {height: '10px', position: 'relative'},
              Alpha: {radius: '2px'},
            },
            disableAlpha: {
              color: {width: '22px'},
              alpha: {display: 'none'},
              hue: {marginBottom: '0px'},
              swatch: {width: '10px', height: '10px', marginTop: '0px'},
            },
          },
          c,
        ),
        {disableAlpha: a},
      )
    return p.createElement(
      'div',
      {style: v.picker, className: 'chrome-picker ' + d},
      p.createElement(
        'div',
        {style: v.saturation},
        p.createElement(qt, {style: v.Saturation, hsl: o, hsv: s, pointer: jm, onChange: n}),
      ),
      p.createElement(
        'div',
        {style: v.body},
        p.createElement(
          'div',
          {style: v.controls, className: 'flexbox-fix'},
          p.createElement(
            'div',
            {style: v.color},
            p.createElement(
              'div',
              {style: v.swatch},
              p.createElement('div', {style: v.active}),
              p.createElement(xr, {renderers: l}),
            ),
          ),
          p.createElement(
            'div',
            {style: v.toggles},
            p.createElement(
              'div',
              {style: v.hue},
              p.createElement(_r, {style: v.Hue, hsl: o, pointer: lc, onChange: n}),
            ),
            p.createElement(
              'div',
              {style: v.alpha},
              p.createElement(Bo, {
                style: v.Alpha,
                rgb: i,
                hsl: o,
                pointer: lc,
                renderers: l,
                onChange: n,
              }),
            ),
          ),
        ),
        p.createElement(ap, {rgb: i, hsl: o, hex: u, view: g, onChange: n, disableAlpha: a}),
      ),
    )
  }
Qo.propTypes = {
  width: P.oneOfType([P.string, P.number]),
  disableAlpha: P.bool,
  styles: P.object,
  defaultView: P.oneOf(['hex', 'rgb', 'hsl']),
}
Qo.defaultProps = {width: 225, disableAlpha: !1, styles: {}}
Q(Qo)
var $m = function (e) {
    var t = e.color,
      n = e.onClick,
      a = n === void 0 ? function () {} : n,
      i = e.onSwatchHover,
      o = e.active,
      s = L(
        {
          default: {
            color: {
              background: t,
              width: '15px',
              height: '15px',
              float: 'left',
              marginRight: '5px',
              marginBottom: '5px',
              position: 'relative',
              cursor: 'pointer',
            },
            dot: {
              absolute: '5px 5px 5px 5px',
              background: Ko(t),
              borderRadius: '50%',
              opacity: '0',
            },
          },
          active: {dot: {opacity: '1'}},
          'color-#FFFFFF': {color: {boxShadow: 'inset 0 0 0 1px #ddd'}, dot: {background: '#000'}},
          transparent: {dot: {background: '#000'}},
        },
        {active: o, 'color-#FFFFFF': t === '#FFFFFF', transparent: t === 'transparent'},
      )
    return p.createElement(
      je,
      {style: s.color, color: t, onClick: a, onHover: i, focusStyle: {boxShadow: '0 0 4px ' + t}},
      p.createElement('div', {style: s.dot}),
    )
  },
  Nm = function (e) {
    var t = e.hex,
      n = e.rgb,
      a = e.onChange,
      i = L({
        default: {
          fields: {
            display: 'flex',
            paddingBottom: '6px',
            paddingRight: '5px',
            position: 'relative',
          },
          active: {
            position: 'absolute',
            top: '6px',
            left: '5px',
            height: '9px',
            width: '9px',
            background: t,
          },
          HEXwrap: {flex: '6', position: 'relative'},
          HEXinput: {
            width: '80%',
            padding: '0px',
            paddingLeft: '20%',
            border: 'none',
            outline: 'none',
            background: 'none',
            fontSize: '12px',
            color: '#333',
            height: '16px',
          },
          HEXlabel: {display: 'none'},
          RGBwrap: {flex: '3', position: 'relative'},
          RGBinput: {
            width: '70%',
            padding: '0px',
            paddingLeft: '30%',
            border: 'none',
            outline: 'none',
            background: 'none',
            fontSize: '12px',
            color: '#333',
            height: '16px',
          },
          RGBlabel: {
            position: 'absolute',
            top: '3px',
            left: '0px',
            lineHeight: '16px',
            textTransform: 'uppercase',
            fontSize: '12px',
            color: '#999',
          },
        },
      }),
      o = function (u, l) {
        u.r || u.g || u.b
          ? a({r: u.r || n.r, g: u.g || n.g, b: u.b || n.b, source: 'rgb'}, l)
          : a({hex: u.hex, source: 'hex'}, l)
      }
    return p.createElement(
      'div',
      {style: i.fields, className: 'flexbox-fix'},
      p.createElement('div', {style: i.active}),
      p.createElement(U, {
        style: {wrap: i.HEXwrap, input: i.HEXinput, label: i.HEXlabel},
        label: 'hex',
        value: t,
        onChange: o,
      }),
      p.createElement(U, {
        style: {wrap: i.RGBwrap, input: i.RGBinput, label: i.RGBlabel},
        label: 'r',
        value: n.r,
        onChange: o,
      }),
      p.createElement(U, {
        style: {wrap: i.RGBwrap, input: i.RGBinput, label: i.RGBlabel},
        label: 'g',
        value: n.g,
        onChange: o,
      }),
      p.createElement(U, {
        style: {wrap: i.RGBwrap, input: i.RGBinput, label: i.RGBlabel},
        label: 'b',
        value: n.b,
        onChange: o,
      }),
    )
  },
  es = function (e) {
    var t = e.onChange,
      n = e.onSwatchHover,
      a = e.colors,
      i = e.hex,
      o = e.rgb,
      s = e.styles,
      u = s === void 0 ? {} : s,
      l = e.className,
      f = l === void 0 ? '' : l,
      c = L(
        te(
          {
            default: {
              Compact: {background: '#f6f6f6', radius: '4px'},
              compact: {
                paddingTop: '5px',
                paddingLeft: '5px',
                boxSizing: 'initial',
                width: '240px',
              },
              clear: {clear: 'both'},
            },
          },
          u,
        ),
      ),
      h = function (g, v) {
        g.hex ? Pe(g.hex) && t({hex: g.hex, source: 'hex'}, v) : t(g, v)
      }
    return p.createElement(
      Vr,
      {style: c.Compact, styles: u},
      p.createElement(
        'div',
        {style: c.compact, className: 'compact-picker ' + f},
        p.createElement(
          'div',
          null,
          $e(a, function (d) {
            return p.createElement($m, {
              key: d,
              color: d,
              active: d.toLowerCase() === i,
              onClick: h,
              onSwatchHover: n,
            })
          }),
          p.createElement('div', {style: c.clear}),
        ),
        p.createElement(Nm, {hex: i, rgb: o, onChange: h}),
      ),
    )
  }
es.propTypes = {colors: P.arrayOf(P.string), styles: P.object}
es.defaultProps = {
  colors: [
    '#4D4D4D',
    '#999999',
    '#FFFFFF',
    '#F44E3B',
    '#FE9200',
    '#FCDC00',
    '#DBDF00',
    '#A4DD00',
    '#68CCCA',
    '#73D8FF',
    '#AEA1FF',
    '#FDA1FF',
    '#333333',
    '#808080',
    '#cccccc',
    '#D33115',
    '#E27300',
    '#FCC400',
    '#B0BC00',
    '#68BC00',
    '#16A5A5',
    '#009CE0',
    '#7B64FF',
    '#FA28FF',
    '#000000',
    '#666666',
    '#B3B3B3',
    '#9F0500',
    '#C45100',
    '#FB9E00',
    '#808900',
    '#194D33',
    '#0C797D',
    '#0062B1',
    '#653294',
    '#AB149E',
  ],
  styles: {},
}
Q(es)
var Gm = function (e) {
  var t = e.hover,
    n = e.color,
    a = e.onClick,
    i = e.onSwatchHover,
    o = {
      position: 'relative',
      zIndex: '2',
      outline: '2px solid #fff',
      boxShadow: '0 0 5px 2px rgba(0,0,0,0.25)',
    },
    s = L(
      {default: {swatch: {width: '25px', height: '25px', fontSize: '0'}}, hover: {swatch: o}},
      {hover: t},
    )
  return p.createElement(
    'div',
    {style: s.swatch},
    p.createElement(je, {color: n, onClick: a, onHover: i, focusStyle: o}),
  )
}
const Um = Lo.handleHover(Gm)
var rs = function (e) {
  var t = e.width,
    n = e.colors,
    a = e.onChange,
    i = e.onSwatchHover,
    o = e.triangle,
    s = e.styles,
    u = s === void 0 ? {} : s,
    l = e.className,
    f = l === void 0 ? '' : l,
    c = L(
      te(
        {
          default: {
            card: {
              width: t,
              background: '#fff',
              border: '1px solid rgba(0,0,0,0.2)',
              boxShadow: '0 3px 12px rgba(0,0,0,0.15)',
              borderRadius: '4px',
              position: 'relative',
              padding: '5px',
              display: 'flex',
              flexWrap: 'wrap',
            },
            triangle: {
              position: 'absolute',
              border: '7px solid transparent',
              borderBottomColor: '#fff',
            },
            triangleShadow: {
              position: 'absolute',
              border: '8px solid transparent',
              borderBottomColor: 'rgba(0,0,0,0.15)',
            },
          },
          'hide-triangle': {triangle: {display: 'none'}, triangleShadow: {display: 'none'}},
          'top-left-triangle': {
            triangle: {top: '-14px', left: '10px'},
            triangleShadow: {top: '-16px', left: '9px'},
          },
          'top-right-triangle': {
            triangle: {top: '-14px', right: '10px'},
            triangleShadow: {top: '-16px', right: '9px'},
          },
          'bottom-left-triangle': {
            triangle: {top: '35px', left: '10px', transform: 'rotate(180deg)'},
            triangleShadow: {top: '37px', left: '9px', transform: 'rotate(180deg)'},
          },
          'bottom-right-triangle': {
            triangle: {top: '35px', right: '10px', transform: 'rotate(180deg)'},
            triangleShadow: {top: '37px', right: '9px', transform: 'rotate(180deg)'},
          },
        },
        u,
      ),
      {
        'hide-triangle': o === 'hide',
        'top-left-triangle': o === 'top-left',
        'top-right-triangle': o === 'top-right',
        'bottom-left-triangle': o === 'bottom-left',
        'bottom-right-triangle': o === 'bottom-right',
      },
    ),
    h = function (g, v) {
      return a({hex: g, source: 'hex'}, v)
    }
  return p.createElement(
    'div',
    {style: c.card, className: 'github-picker ' + f},
    p.createElement('div', {style: c.triangleShadow}),
    p.createElement('div', {style: c.triangle}),
    $e(n, function (d) {
      return p.createElement(Um, {color: d, key: d, onClick: h, onSwatchHover: i})
    }),
  )
}
rs.propTypes = {
  width: P.oneOfType([P.string, P.number]),
  colors: P.arrayOf(P.string),
  triangle: P.oneOf(['hide', 'top-left', 'top-right', 'bottom-left', 'bottom-right']),
  styles: P.object,
}
rs.defaultProps = {
  width: 200,
  colors: [
    '#B80000',
    '#DB3E00',
    '#FCCB00',
    '#008B02',
    '#006B76',
    '#1273DE',
    '#004DCF',
    '#5300EB',
    '#EB9694',
    '#FAD0C3',
    '#FEF3BD',
    '#C1E1C5',
    '#BEDADC',
    '#C4DEF6',
    '#BED3F3',
    '#D4C4FB',
  ],
  triangle: 'top-left',
  styles: {},
}
Q(rs)
var zm = function (e) {
    var t = e.direction,
      n = L(
        {
          default: {
            picker: {
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              transform: 'translate(-9px, -1px)',
              backgroundColor: 'rgb(248, 248, 248)',
              boxShadow: '0 1px 4px 0 rgba(0, 0, 0, 0.37)',
            },
          },
          vertical: {picker: {transform: 'translate(-3px, -9px)'}},
        },
        {vertical: t === 'vertical'},
      )
    return p.createElement('div', {style: n.picker})
  },
  Wm =
    Object.assign ||
    function (r) {
      for (var e = 1; e < arguments.length; e++) {
        var t = arguments[e]
        for (var n in t) Object.prototype.hasOwnProperty.call(t, n) && (r[n] = t[n])
      }
      return r
    },
  ts = function (e) {
    var t = e.width,
      n = e.height,
      a = e.onChange,
      i = e.hsl,
      o = e.direction,
      s = e.pointer,
      u = e.styles,
      l = u === void 0 ? {} : u,
      f = e.className,
      c = f === void 0 ? '' : f,
      h = L(
        te(
          {default: {picker: {position: 'relative', width: t, height: n}, hue: {radius: '2px'}}},
          l,
        ),
      ),
      d = function (v) {
        return a({a: 1, h: v.h, l: 0.5, s: 1})
      }
    return p.createElement(
      'div',
      {style: h.picker, className: 'hue-picker ' + c},
      p.createElement(_r, Wm({}, h.hue, {hsl: i, pointer: s, onChange: d, direction: o})),
    )
  }
ts.propTypes = {styles: P.object}
ts.defaultProps = {width: '316px', height: '16px', direction: 'horizontal', pointer: zm, styles: {}}
Q(ts)
var Km = function (e) {
  var t = e.onChange,
    n = e.hex,
    a = e.rgb,
    i = e.styles,
    o = i === void 0 ? {} : i,
    s = e.className,
    u = s === void 0 ? '' : s,
    l = L(
      te(
        {
          default: {
            material: {width: '98px', height: '98px', padding: '16px', fontFamily: 'Roboto'},
            HEXwrap: {position: 'relative'},
            HEXinput: {
              width: '100%',
              marginTop: '12px',
              fontSize: '15px',
              color: '#333',
              padding: '0px',
              border: '0px',
              borderBottom: '2px solid ' + n,
              outline: 'none',
              height: '30px',
            },
            HEXlabel: {
              position: 'absolute',
              top: '0px',
              left: '0px',
              fontSize: '11px',
              color: '#999999',
              textTransform: 'capitalize',
            },
            Hex: {style: {}},
            RGBwrap: {position: 'relative'},
            RGBinput: {
              width: '100%',
              marginTop: '12px',
              fontSize: '15px',
              color: '#333',
              padding: '0px',
              border: '0px',
              borderBottom: '1px solid #eee',
              outline: 'none',
              height: '30px',
            },
            RGBlabel: {
              position: 'absolute',
              top: '0px',
              left: '0px',
              fontSize: '11px',
              color: '#999999',
              textTransform: 'capitalize',
            },
            split: {display: 'flex', marginRight: '-10px', paddingTop: '11px'},
            third: {flex: '1', paddingRight: '10px'},
          },
        },
        o,
      ),
    ),
    f = function (h, d) {
      h.hex
        ? Pe(h.hex) && t({hex: h.hex, source: 'hex'}, d)
        : (h.r || h.g || h.b) && t({r: h.r || a.r, g: h.g || a.g, b: h.b || a.b, source: 'rgb'}, d)
    }
  return p.createElement(
    Vr,
    {styles: o},
    p.createElement(
      'div',
      {style: l.material, className: 'material-picker ' + u},
      p.createElement(U, {
        style: {wrap: l.HEXwrap, input: l.HEXinput, label: l.HEXlabel},
        label: 'hex',
        value: n,
        onChange: f,
      }),
      p.createElement(
        'div',
        {style: l.split, className: 'flexbox-fix'},
        p.createElement(
          'div',
          {style: l.third},
          p.createElement(U, {
            style: {wrap: l.RGBwrap, input: l.RGBinput, label: l.RGBlabel},
            label: 'r',
            value: a.r,
            onChange: f,
          }),
        ),
        p.createElement(
          'div',
          {style: l.third},
          p.createElement(U, {
            style: {wrap: l.RGBwrap, input: l.RGBinput, label: l.RGBlabel},
            label: 'g',
            value: a.g,
            onChange: f,
          }),
        ),
        p.createElement(
          'div',
          {style: l.third},
          p.createElement(U, {
            style: {wrap: l.RGBwrap, input: l.RGBinput, label: l.RGBlabel},
            label: 'b',
            value: a.b,
            onChange: f,
          }),
        ),
      ),
    ),
  )
}
Q(Km)
var Vm = function (e) {
    var t = e.onChange,
      n = e.rgb,
      a = e.hsv,
      i = e.hex,
      o = L({
        default: {
          fields: {paddingTop: '5px', paddingBottom: '9px', width: '80px', position: 'relative'},
          divider: {height: '5px'},
          RGBwrap: {position: 'relative'},
          RGBinput: {
            marginLeft: '40%',
            width: '40%',
            height: '18px',
            border: '1px solid #888888',
            boxShadow: 'inset 0 1px 1px rgba(0,0,0,.1), 0 1px 0 0 #ECECEC',
            marginBottom: '5px',
            fontSize: '13px',
            paddingLeft: '3px',
            marginRight: '10px',
          },
          RGBlabel: {
            left: '0px',
            top: '0px',
            width: '34px',
            textTransform: 'uppercase',
            fontSize: '13px',
            height: '18px',
            lineHeight: '22px',
            position: 'absolute',
          },
          HEXwrap: {position: 'relative'},
          HEXinput: {
            marginLeft: '20%',
            width: '80%',
            height: '18px',
            border: '1px solid #888888',
            boxShadow: 'inset 0 1px 1px rgba(0,0,0,.1), 0 1px 0 0 #ECECEC',
            marginBottom: '6px',
            fontSize: '13px',
            paddingLeft: '3px',
          },
          HEXlabel: {
            position: 'absolute',
            top: '0px',
            left: '0px',
            width: '14px',
            textTransform: 'uppercase',
            fontSize: '13px',
            height: '18px',
            lineHeight: '22px',
          },
          fieldSymbols: {position: 'absolute', top: '5px', right: '-7px', fontSize: '13px'},
          symbol: {height: '20px', lineHeight: '22px', paddingBottom: '7px'},
        },
      }),
      s = function (l, f) {
        l['#']
          ? Pe(l['#']) && t({hex: l['#'], source: 'hex'}, f)
          : l.r || l.g || l.b
            ? t({r: l.r || n.r, g: l.g || n.g, b: l.b || n.b, source: 'rgb'}, f)
            : (l.h || l.s || l.v) &&
              t({h: l.h || a.h, s: l.s || a.s, v: l.v || a.v, source: 'hsv'}, f)
      }
    return p.createElement(
      'div',
      {style: o.fields},
      p.createElement(U, {
        style: {wrap: o.RGBwrap, input: o.RGBinput, label: o.RGBlabel},
        label: 'h',
        value: Math.round(a.h),
        onChange: s,
      }),
      p.createElement(U, {
        style: {wrap: o.RGBwrap, input: o.RGBinput, label: o.RGBlabel},
        label: 's',
        value: Math.round(a.s * 100),
        onChange: s,
      }),
      p.createElement(U, {
        style: {wrap: o.RGBwrap, input: o.RGBinput, label: o.RGBlabel},
        label: 'v',
        value: Math.round(a.v * 100),
        onChange: s,
      }),
      p.createElement('div', {style: o.divider}),
      p.createElement(U, {
        style: {wrap: o.RGBwrap, input: o.RGBinput, label: o.RGBlabel},
        label: 'r',
        value: n.r,
        onChange: s,
      }),
      p.createElement(U, {
        style: {wrap: o.RGBwrap, input: o.RGBinput, label: o.RGBlabel},
        label: 'g',
        value: n.g,
        onChange: s,
      }),
      p.createElement(U, {
        style: {wrap: o.RGBwrap, input: o.RGBinput, label: o.RGBlabel},
        label: 'b',
        value: n.b,
        onChange: s,
      }),
      p.createElement('div', {style: o.divider}),
      p.createElement(U, {
        style: {wrap: o.HEXwrap, input: o.HEXinput, label: o.HEXlabel},
        label: '#',
        value: i.replace('#', ''),
        onChange: s,
      }),
      p.createElement(
        'div',
        {style: o.fieldSymbols},
        p.createElement('div', {style: o.symbol}, '°'),
        p.createElement('div', {style: o.symbol}, '%'),
        p.createElement('div', {style: o.symbol}, '%'),
      ),
    )
  },
  Xm = function (e) {
    var t = e.hsl,
      n = L(
        {
          default: {
            picker: {
              width: '12px',
              height: '12px',
              borderRadius: '6px',
              boxShadow: 'inset 0 0 0 1px #fff',
              transform: 'translate(-6px, -6px)',
            },
          },
          'black-outline': {picker: {boxShadow: 'inset 0 0 0 1px #000'}},
        },
        {'black-outline': t.l > 0.5},
      )
    return p.createElement('div', {style: n.picker})
  },
  Ym = function () {
    var e = L({
      default: {
        triangle: {
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderWidth: '4px 0 4px 6px',
          borderColor: 'transparent transparent transparent #fff',
          position: 'absolute',
          top: '1px',
          left: '1px',
        },
        triangleBorder: {
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderWidth: '5px 0 5px 8px',
          borderColor: 'transparent transparent transparent #555',
        },
        left: {Extend: 'triangleBorder', transform: 'translate(-13px, -4px)'},
        leftInside: {Extend: 'triangle', transform: 'translate(-8px, -5px)'},
        right: {Extend: 'triangleBorder', transform: 'translate(20px, -14px) rotate(180deg)'},
        rightInside: {Extend: 'triangle', transform: 'translate(-8px, -5px)'},
      },
    })
    return p.createElement(
      'div',
      {style: e.pointer},
      p.createElement('div', {style: e.left}, p.createElement('div', {style: e.leftInside})),
      p.createElement('div', {style: e.right}, p.createElement('div', {style: e.rightInside})),
    )
  },
  fc = function (e) {
    var t = e.onClick,
      n = e.label,
      a = e.children,
      i = e.active,
      o = L(
        {
          default: {
            button: {
              backgroundImage: 'linear-gradient(-180deg, #FFFFFF 0%, #E6E6E6 100%)',
              border: '1px solid #878787',
              borderRadius: '2px',
              height: '20px',
              boxShadow: '0 1px 0 0 #EAEAEA',
              fontSize: '14px',
              color: '#000',
              lineHeight: '20px',
              textAlign: 'center',
              marginBottom: '10px',
              cursor: 'pointer',
            },
          },
          active: {button: {boxShadow: '0 0 0 1px #878787'}},
        },
        {active: i},
      )
    return p.createElement('div', {style: o.button, onClick: t}, n || a)
  },
  Zm = function (e) {
    var t = e.rgb,
      n = e.currentColor,
      a = L({
        default: {
          swatches: {
            border: '1px solid #B3B3B3',
            borderBottom: '1px solid #F0F0F0',
            marginBottom: '2px',
            marginTop: '1px',
          },
          new: {
            height: '34px',
            background: 'rgb(' + t.r + ',' + t.g + ', ' + t.b + ')',
            boxShadow: 'inset 1px 0 0 #000, inset -1px 0 0 #000, inset 0 1px 0 #000',
          },
          current: {
            height: '34px',
            background: n,
            boxShadow: 'inset 1px 0 0 #000, inset -1px 0 0 #000, inset 0 -1px 0 #000',
          },
          label: {fontSize: '14px', color: '#000', textAlign: 'center'},
        },
      })
    return p.createElement(
      'div',
      null,
      p.createElement('div', {style: a.label}, 'new'),
      p.createElement(
        'div',
        {style: a.swatches},
        p.createElement('div', {style: a.new}),
        p.createElement('div', {style: a.current}),
      ),
      p.createElement('div', {style: a.label}, 'current'),
    )
  },
  Jm = (function () {
    function r(e, t) {
      for (var n = 0; n < t.length; n++) {
        var a = t[n]
        ;((a.enumerable = a.enumerable || !1),
          (a.configurable = !0),
          'value' in a && (a.writable = !0),
          Object.defineProperty(e, a.key, a))
      }
    }
    return function (e, t, n) {
      return (t && r(e.prototype, t), n && r(e, n), e)
    }
  })()
function Qm(r, e) {
  if (!(r instanceof e)) throw new TypeError('Cannot call a class as a function')
}
function e1(r, e) {
  if (!r) throw new ReferenceError("this hasn't been initialised - super() hasn't been called")
  return e && (typeof e == 'object' || typeof e == 'function') ? e : r
}
function r1(r, e) {
  if (typeof e != 'function' && e !== null)
    throw new TypeError('Super expression must either be null or a function, not ' + typeof e)
  ;((r.prototype = Object.create(e && e.prototype, {
    constructor: {value: r, enumerable: !1, writable: !0, configurable: !0},
  })),
    e && (Object.setPrototypeOf ? Object.setPrototypeOf(r, e) : (r.__proto__ = e)))
}
var ns = (function (r) {
  r1(e, r)
  function e(t) {
    Qm(this, e)
    var n = e1(this, (e.__proto__ || Object.getPrototypeOf(e)).call(this))
    return ((n.state = {currentColor: t.hex}), n)
  }
  return (
    Jm(e, [
      {
        key: 'render',
        value: function () {
          var n = this.props,
            a = n.styles,
            i = a === void 0 ? {} : a,
            o = n.className,
            s = o === void 0 ? '' : o,
            u = L(
              te(
                {
                  default: {
                    picker: {
                      background: '#DCDCDC',
                      borderRadius: '4px',
                      boxShadow: '0 0 0 1px rgba(0,0,0,.25), 0 8px 16px rgba(0,0,0,.15)',
                      boxSizing: 'initial',
                      width: '513px',
                    },
                    head: {
                      backgroundImage: 'linear-gradient(-180deg, #F0F0F0 0%, #D4D4D4 100%)',
                      borderBottom: '1px solid #B1B1B1',
                      boxShadow:
                        'inset 0 1px 0 0 rgba(255,255,255,.2), inset 0 -1px 0 0 rgba(0,0,0,.02)',
                      height: '23px',
                      lineHeight: '24px',
                      borderRadius: '4px 4px 0 0',
                      fontSize: '13px',
                      color: '#4D4D4D',
                      textAlign: 'center',
                    },
                    body: {padding: '15px 15px 0', display: 'flex'},
                    saturation: {
                      width: '256px',
                      height: '256px',
                      position: 'relative',
                      border: '2px solid #B3B3B3',
                      borderBottom: '2px solid #F0F0F0',
                      overflow: 'hidden',
                    },
                    hue: {
                      position: 'relative',
                      height: '256px',
                      width: '19px',
                      marginLeft: '10px',
                      border: '2px solid #B3B3B3',
                      borderBottom: '2px solid #F0F0F0',
                    },
                    controls: {width: '180px', marginLeft: '10px'},
                    top: {display: 'flex'},
                    previews: {width: '60px'},
                    actions: {flex: '1', marginLeft: '20px'},
                  },
                },
                i,
              ),
            )
          return p.createElement(
            'div',
            {style: u.picker, className: 'photoshop-picker ' + s},
            p.createElement('div', {style: u.head}, this.props.header),
            p.createElement(
              'div',
              {style: u.body, className: 'flexbox-fix'},
              p.createElement(
                'div',
                {style: u.saturation},
                p.createElement(qt, {
                  hsl: this.props.hsl,
                  hsv: this.props.hsv,
                  pointer: Xm,
                  onChange: this.props.onChange,
                }),
              ),
              p.createElement(
                'div',
                {style: u.hue},
                p.createElement(_r, {
                  direction: 'vertical',
                  hsl: this.props.hsl,
                  pointer: Ym,
                  onChange: this.props.onChange,
                }),
              ),
              p.createElement(
                'div',
                {style: u.controls},
                p.createElement(
                  'div',
                  {style: u.top, className: 'flexbox-fix'},
                  p.createElement(
                    'div',
                    {style: u.previews},
                    p.createElement(Zm, {
                      rgb: this.props.rgb,
                      currentColor: this.state.currentColor,
                    }),
                  ),
                  p.createElement(
                    'div',
                    {style: u.actions},
                    p.createElement(fc, {label: 'OK', onClick: this.props.onAccept, active: !0}),
                    p.createElement(fc, {label: 'Cancel', onClick: this.props.onCancel}),
                    p.createElement(Vm, {
                      onChange: this.props.onChange,
                      rgb: this.props.rgb,
                      hsv: this.props.hsv,
                      hex: this.props.hex,
                    }),
                  ),
                ),
              ),
            ),
          )
        },
      },
    ]),
    e
  )
})(p.Component)
ns.propTypes = {header: P.string, styles: P.object}
ns.defaultProps = {header: 'Color Picker', styles: {}}
Q(ns)
var t1 = function (e) {
    var t = e.onChange,
      n = e.rgb,
      a = e.hsl,
      i = e.hex,
      o = e.disableAlpha,
      s = L(
        {
          default: {
            fields: {display: 'flex', paddingTop: '4px'},
            single: {flex: '1', paddingLeft: '6px'},
            alpha: {flex: '1', paddingLeft: '6px'},
            double: {flex: '2'},
            input: {
              width: '80%',
              padding: '4px 10% 3px',
              border: 'none',
              boxShadow: 'inset 0 0 0 1px #ccc',
              fontSize: '11px',
            },
            label: {
              display: 'block',
              textAlign: 'center',
              fontSize: '11px',
              color: '#222',
              paddingTop: '3px',
              paddingBottom: '4px',
              textTransform: 'capitalize',
            },
          },
          disableAlpha: {alpha: {display: 'none'}},
        },
        {disableAlpha: o},
      ),
      u = function (f, c) {
        f.hex
          ? Pe(f.hex) && t({hex: f.hex, source: 'hex'}, c)
          : f.r || f.g || f.b
            ? t({r: f.r || n.r, g: f.g || n.g, b: f.b || n.b, a: n.a, source: 'rgb'}, c)
            : f.a &&
              (f.a < 0 ? (f.a = 0) : f.a > 100 && (f.a = 100),
              (f.a /= 100),
              t({h: a.h, s: a.s, l: a.l, a: f.a, source: 'rgb'}, c))
      }
    return p.createElement(
      'div',
      {style: s.fields, className: 'flexbox-fix'},
      p.createElement(
        'div',
        {style: s.double},
        p.createElement(U, {
          style: {input: s.input, label: s.label},
          label: 'hex',
          value: i.replace('#', ''),
          onChange: u,
        }),
      ),
      p.createElement(
        'div',
        {style: s.single},
        p.createElement(U, {
          style: {input: s.input, label: s.label},
          label: 'r',
          value: n.r,
          onChange: u,
          dragLabel: 'true',
          dragMax: '255',
        }),
      ),
      p.createElement(
        'div',
        {style: s.single},
        p.createElement(U, {
          style: {input: s.input, label: s.label},
          label: 'g',
          value: n.g,
          onChange: u,
          dragLabel: 'true',
          dragMax: '255',
        }),
      ),
      p.createElement(
        'div',
        {style: s.single},
        p.createElement(U, {
          style: {input: s.input, label: s.label},
          label: 'b',
          value: n.b,
          onChange: u,
          dragLabel: 'true',
          dragMax: '255',
        }),
      ),
      p.createElement(
        'div',
        {style: s.alpha},
        p.createElement(U, {
          style: {input: s.input, label: s.label},
          label: 'a',
          value: Math.round(n.a * 100),
          onChange: u,
          dragLabel: 'true',
          dragMax: '100',
        }),
      ),
    )
  },
  n1 =
    Object.assign ||
    function (r) {
      for (var e = 1; e < arguments.length; e++) {
        var t = arguments[e]
        for (var n in t) Object.prototype.hasOwnProperty.call(t, n) && (r[n] = t[n])
      }
      return r
    },
  ip = function (e) {
    var t = e.colors,
      n = e.onClick,
      a = n === void 0 ? function () {} : n,
      i = e.onSwatchHover,
      o = L(
        {
          default: {
            colors: {
              margin: '0 -10px',
              padding: '10px 0 0 10px',
              borderTop: '1px solid #eee',
              display: 'flex',
              flexWrap: 'wrap',
              position: 'relative',
            },
            swatchWrap: {width: '16px', height: '16px', margin: '0 10px 10px 0'},
            swatch: {borderRadius: '3px', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.15)'},
          },
          'no-presets': {colors: {display: 'none'}},
        },
        {'no-presets': !t || !t.length},
      ),
      s = function (l, f) {
        a({hex: l, source: 'hex'}, f)
      }
    return p.createElement(
      'div',
      {style: o.colors, className: 'flexbox-fix'},
      t.map(function (u) {
        var l = typeof u == 'string' ? {color: u} : u,
          f = '' + l.color + (l.title || '')
        return p.createElement(
          'div',
          {key: f, style: o.swatchWrap},
          p.createElement(
            je,
            n1({}, l, {
              style: o.swatch,
              onClick: s,
              onHover: i,
              focusStyle: {boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.15), 0 0 4px ' + l.color},
            }),
          ),
        )
      }),
    )
  }
ip.propTypes = {
  colors: P.arrayOf(P.oneOfType([P.string, P.shape({color: P.string, title: P.string})]))
    .isRequired,
}
var a1 =
    Object.assign ||
    function (r) {
      for (var e = 1; e < arguments.length; e++) {
        var t = arguments[e]
        for (var n in t) Object.prototype.hasOwnProperty.call(t, n) && (r[n] = t[n])
      }
      return r
    },
  as = function (e) {
    var t = e.width,
      n = e.rgb,
      a = e.hex,
      i = e.hsv,
      o = e.hsl,
      s = e.onChange,
      u = e.onSwatchHover,
      l = e.disableAlpha,
      f = e.presetColors,
      c = e.renderers,
      h = e.styles,
      d = h === void 0 ? {} : h,
      g = e.className,
      v = g === void 0 ? '' : g,
      b = L(
        te(
          {
            default: a1(
              {
                picker: {
                  width: t,
                  padding: '10px 10px 0',
                  boxSizing: 'initial',
                  background: '#fff',
                  borderRadius: '4px',
                  boxShadow: '0 0 0 1px rgba(0,0,0,.15), 0 8px 16px rgba(0,0,0,.15)',
                },
                saturation: {
                  width: '100%',
                  paddingBottom: '75%',
                  position: 'relative',
                  overflow: 'hidden',
                },
                Saturation: {
                  radius: '3px',
                  shadow: 'inset 0 0 0 1px rgba(0,0,0,.15), inset 0 0 4px rgba(0,0,0,.25)',
                },
                controls: {display: 'flex'},
                sliders: {padding: '4px 0', flex: '1'},
                color: {
                  width: '24px',
                  height: '24px',
                  position: 'relative',
                  marginTop: '4px',
                  marginLeft: '4px',
                  borderRadius: '3px',
                },
                activeColor: {
                  absolute: '0px 0px 0px 0px',
                  borderRadius: '2px',
                  background: 'rgba(' + n.r + ',' + n.g + ',' + n.b + ',' + n.a + ')',
                  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.15), inset 0 0 4px rgba(0,0,0,.25)',
                },
                hue: {position: 'relative', height: '10px', overflow: 'hidden'},
                Hue: {
                  radius: '2px',
                  shadow: 'inset 0 0 0 1px rgba(0,0,0,.15), inset 0 0 4px rgba(0,0,0,.25)',
                },
                alpha: {position: 'relative', height: '10px', marginTop: '4px', overflow: 'hidden'},
                Alpha: {
                  radius: '2px',
                  shadow: 'inset 0 0 0 1px rgba(0,0,0,.15), inset 0 0 4px rgba(0,0,0,.25)',
                },
              },
              d,
            ),
            disableAlpha: {
              color: {height: '10px'},
              hue: {height: '10px'},
              alpha: {display: 'none'},
            },
          },
          d,
        ),
        {disableAlpha: l},
      )
    return p.createElement(
      'div',
      {style: b.picker, className: 'sketch-picker ' + v},
      p.createElement(
        'div',
        {style: b.saturation},
        p.createElement(qt, {style: b.Saturation, hsl: o, hsv: i, onChange: s}),
      ),
      p.createElement(
        'div',
        {style: b.controls, className: 'flexbox-fix'},
        p.createElement(
          'div',
          {style: b.sliders},
          p.createElement(
            'div',
            {style: b.hue},
            p.createElement(_r, {style: b.Hue, hsl: o, onChange: s}),
          ),
          p.createElement(
            'div',
            {style: b.alpha},
            p.createElement(Bo, {style: b.Alpha, rgb: n, hsl: o, renderers: c, onChange: s}),
          ),
        ),
        p.createElement(
          'div',
          {style: b.color},
          p.createElement(xr, null),
          p.createElement('div', {style: b.activeColor}),
        ),
      ),
      p.createElement(t1, {rgb: n, hsl: o, hex: a, onChange: s, disableAlpha: l}),
      p.createElement(ip, {colors: f, onClick: s, onSwatchHover: u}),
    )
  }
as.propTypes = {disableAlpha: P.bool, width: P.oneOfType([P.string, P.number]), styles: P.object}
as.defaultProps = {
  disableAlpha: !1,
  width: 200,
  styles: {},
  presetColors: [
    '#D0021B',
    '#F5A623',
    '#F8E71C',
    '#8B572A',
    '#7ED321',
    '#417505',
    '#BD10E0',
    '#9013FE',
    '#4A90E2',
    '#50E3C2',
    '#B8E986',
    '#000000',
    '#4A4A4A',
    '#9B9B9B',
    '#FFFFFF',
  ],
}
Q(as)
var Rr = function (e) {
    var t = e.hsl,
      n = e.offset,
      a = e.onClick,
      i = a === void 0 ? function () {} : a,
      o = e.active,
      s = e.first,
      u = e.last,
      l = L(
        {
          default: {
            swatch: {
              height: '12px',
              background: 'hsl(' + t.h + ', 50%, ' + n * 100 + '%)',
              cursor: 'pointer',
            },
          },
          first: {swatch: {borderRadius: '2px 0 0 2px'}},
          last: {swatch: {borderRadius: '0 2px 2px 0'}},
          active: {swatch: {transform: 'scaleY(1.8)', borderRadius: '3.6px/2px'}},
        },
        {active: o, first: s, last: u},
      ),
      f = function (h) {
        return i({h: t.h, s: 0.5, l: n, source: 'hsl'}, h)
      }
    return p.createElement('div', {style: l.swatch, onClick: f})
  },
  i1 = function (e) {
    var t = e.onClick,
      n = e.hsl,
      a = L({
        default: {
          swatches: {marginTop: '20px'},
          swatch: {boxSizing: 'border-box', width: '20%', paddingRight: '1px', float: 'left'},
          clear: {clear: 'both'},
        },
      }),
      i = 0.1
    return p.createElement(
      'div',
      {style: a.swatches},
      p.createElement(
        'div',
        {style: a.swatch},
        p.createElement(Rr, {
          hsl: n,
          offset: '.80',
          active: Math.abs(n.l - 0.8) < i && Math.abs(n.s - 0.5) < i,
          onClick: t,
          first: !0,
        }),
      ),
      p.createElement(
        'div',
        {style: a.swatch},
        p.createElement(Rr, {
          hsl: n,
          offset: '.65',
          active: Math.abs(n.l - 0.65) < i && Math.abs(n.s - 0.5) < i,
          onClick: t,
        }),
      ),
      p.createElement(
        'div',
        {style: a.swatch},
        p.createElement(Rr, {
          hsl: n,
          offset: '.50',
          active: Math.abs(n.l - 0.5) < i && Math.abs(n.s - 0.5) < i,
          onClick: t,
        }),
      ),
      p.createElement(
        'div',
        {style: a.swatch},
        p.createElement(Rr, {
          hsl: n,
          offset: '.35',
          active: Math.abs(n.l - 0.35) < i && Math.abs(n.s - 0.5) < i,
          onClick: t,
        }),
      ),
      p.createElement(
        'div',
        {style: a.swatch},
        p.createElement(Rr, {
          hsl: n,
          offset: '.20',
          active: Math.abs(n.l - 0.2) < i && Math.abs(n.s - 0.5) < i,
          onClick: t,
          last: !0,
        }),
      ),
      p.createElement('div', {style: a.clear}),
    )
  },
  o1 = function () {
    var e = L({
      default: {
        picker: {
          width: '14px',
          height: '14px',
          borderRadius: '6px',
          transform: 'translate(-7px, -1px)',
          backgroundColor: 'rgb(248, 248, 248)',
          boxShadow: '0 1px 4px 0 rgba(0, 0, 0, 0.37)',
        },
      },
    })
    return p.createElement('div', {style: e.picker})
  },
  is = function (e) {
    var t = e.hsl,
      n = e.onChange,
      a = e.pointer,
      i = e.styles,
      o = i === void 0 ? {} : i,
      s = e.className,
      u = s === void 0 ? '' : s,
      l = L(te({default: {hue: {height: '12px', position: 'relative'}, Hue: {radius: '2px'}}}, o))
    return p.createElement(
      'div',
      {style: l.wrap || {}, className: 'slider-picker ' + u},
      p.createElement(
        'div',
        {style: l.hue},
        p.createElement(_r, {style: l.Hue, hsl: t, pointer: a, onChange: n}),
      ),
      p.createElement('div', {style: l.swatches}, p.createElement(i1, {hsl: t, onClick: n})),
    )
  }
is.propTypes = {styles: P.object}
is.defaultProps = {pointer: o1, styles: {}}
Q(is)
var it = {},
  cc
function s1() {
  if (cc) return it
  ;((cc = 1), Object.defineProperty(it, '__esModule', {value: !0}))
  var r =
      Object.assign ||
      function (o) {
        for (var s = 1; s < arguments.length; s++) {
          var u = arguments[s]
          for (var l in u) Object.prototype.hasOwnProperty.call(u, l) && (o[l] = u[l])
        }
        return o
      },
    e = p,
    t = n(e)
  function n(o) {
    return o && o.__esModule ? o : {default: o}
  }
  function a(o, s) {
    var u = {}
    for (var l in o)
      s.indexOf(l) >= 0 || (Object.prototype.hasOwnProperty.call(o, l) && (u[l] = o[l]))
    return u
  }
  var i = 24
  return (
    (it.default = function (o) {
      var s = o.fill,
        u = s === void 0 ? 'currentColor' : s,
        l = o.width,
        f = l === void 0 ? i : l,
        c = o.height,
        h = c === void 0 ? i : c,
        d = o.style,
        g = d === void 0 ? {} : d,
        v = a(o, ['fill', 'width', 'height', 'style'])
      return t.default.createElement(
        'svg',
        r({viewBox: '0 0 ' + i + ' ' + i, style: r({fill: u, width: f, height: h}, g)}, v),
        t.default.createElement('path', {
          d: 'M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z',
        }),
      )
    }),
    it
  )
}
var u1 = s1()
const l1 = bt(u1)
var f1 = function (e) {
    var t = e.color,
      n = e.onClick,
      a = n === void 0 ? function () {} : n,
      i = e.onSwatchHover,
      o = e.first,
      s = e.last,
      u = e.active,
      l = L(
        {
          default: {
            color: {
              width: '40px',
              height: '24px',
              cursor: 'pointer',
              background: t,
              marginBottom: '1px',
            },
            check: {color: Ko(t), marginLeft: '8px', display: 'none'},
          },
          first: {color: {overflow: 'hidden', borderRadius: '2px 2px 0 0'}},
          last: {color: {overflow: 'hidden', borderRadius: '0 0 2px 2px'}},
          active: {check: {display: 'block'}},
          'color-#FFFFFF': {color: {boxShadow: 'inset 0 0 0 1px #ddd'}, check: {color: '#333'}},
          transparent: {check: {color: '#333'}},
        },
        {
          first: o,
          last: s,
          active: u,
          'color-#FFFFFF': t === '#FFFFFF',
          transparent: t === 'transparent',
        },
      )
    return p.createElement(
      je,
      {color: t, style: l.color, onClick: a, onHover: i, focusStyle: {boxShadow: '0 0 4px ' + t}},
      p.createElement('div', {style: l.check}, p.createElement(l1, null)),
    )
  },
  c1 = function (e) {
    var t = e.onClick,
      n = e.onSwatchHover,
      a = e.group,
      i = e.active,
      o = L({
        default: {
          group: {paddingBottom: '10px', width: '40px', float: 'left', marginRight: '10px'},
        },
      })
    return p.createElement(
      'div',
      {style: o.group},
      $e(a, function (s, u) {
        return p.createElement(f1, {
          key: s,
          color: s,
          active: s.toLowerCase() === i,
          first: u === 0,
          last: u === a.length - 1,
          onClick: t,
          onSwatchHover: n,
        })
      }),
    )
  },
  os = function (e) {
    var t = e.width,
      n = e.height,
      a = e.onChange,
      i = e.onSwatchHover,
      o = e.colors,
      s = e.hex,
      u = e.styles,
      l = u === void 0 ? {} : u,
      f = e.className,
      c = f === void 0 ? '' : f,
      h = L(
        te(
          {
            default: {
              picker: {width: t, height: n},
              overflow: {height: n, overflowY: 'scroll'},
              body: {padding: '16px 0 6px 16px'},
              clear: {clear: 'both'},
            },
          },
          l,
        ),
      ),
      d = function (v, b) {
        return a({hex: v, source: 'hex'}, b)
      }
    return p.createElement(
      'div',
      {style: h.picker, className: 'swatches-picker ' + c},
      p.createElement(
        Vr,
        null,
        p.createElement(
          'div',
          {style: h.overflow},
          p.createElement(
            'div',
            {style: h.body},
            $e(o, function (g) {
              return p.createElement(c1, {
                key: g.toString(),
                group: g,
                active: s,
                onClick: d,
                onSwatchHover: i,
              })
            }),
            p.createElement('div', {style: h.clear}),
          ),
        ),
      ),
    )
  }
os.propTypes = {
  width: P.oneOfType([P.string, P.number]),
  height: P.oneOfType([P.string, P.number]),
  colors: P.arrayOf(P.arrayOf(P.string)),
  styles: P.object,
}
os.defaultProps = {
  width: 320,
  height: 240,
  colors: [
    [tr[900], tr[700], tr[500], tr[300], tr[100]],
    [nr[900], nr[700], nr[500], nr[300], nr[100]],
    [ar[900], ar[700], ar[500], ar[300], ar[100]],
    [ir[900], ir[700], ir[500], ir[300], ir[100]],
    [or[900], or[700], or[500], or[300], or[100]],
    [sr[900], sr[700], sr[500], sr[300], sr[100]],
    [ur[900], ur[700], ur[500], ur[300], ur[100]],
    [lr[900], lr[700], lr[500], lr[300], lr[100]],
    [fr[900], fr[700], fr[500], fr[300], fr[100]],
    ['#194D33', Ir[700], Ir[500], Ir[300], Ir[100]],
    [cr[900], cr[700], cr[500], cr[300], cr[100]],
    [hr[900], hr[700], hr[500], hr[300], hr[100]],
    [pr[900], pr[700], pr[500], pr[300], pr[100]],
    [dr[900], dr[700], dr[500], dr[300], dr[100]],
    [gr[900], gr[700], gr[500], gr[300], gr[100]],
    [vr[900], vr[700], vr[500], vr[300], vr[100]],
    [br[900], br[700], br[500], br[300], br[100]],
    [yr[900], yr[700], yr[500], yr[300], yr[100]],
    ['#000000', '#525252', '#969696', '#D9D9D9', '#FFFFFF'],
  ],
  styles: {},
}
Q(os)
var ss = function (e) {
  var t = e.onChange,
    n = e.onSwatchHover,
    a = e.hex,
    i = e.colors,
    o = e.width,
    s = e.triangle,
    u = e.styles,
    l = u === void 0 ? {} : u,
    f = e.className,
    c = f === void 0 ? '' : f,
    h = L(
      te(
        {
          default: {
            card: {
              width: o,
              background: '#fff',
              border: '0 solid rgba(0,0,0,0.25)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
              borderRadius: '4px',
              position: 'relative',
            },
            body: {padding: '15px 9px 9px 15px'},
            label: {fontSize: '18px', color: '#fff'},
            triangle: {
              width: '0px',
              height: '0px',
              borderStyle: 'solid',
              borderWidth: '0 9px 10px 9px',
              borderColor: 'transparent transparent #fff transparent',
              position: 'absolute',
            },
            triangleShadow: {
              width: '0px',
              height: '0px',
              borderStyle: 'solid',
              borderWidth: '0 9px 10px 9px',
              borderColor: 'transparent transparent rgba(0,0,0,.1) transparent',
              position: 'absolute',
            },
            hash: {
              background: '#F0F0F0',
              height: '30px',
              width: '30px',
              borderRadius: '4px 0 0 4px',
              float: 'left',
              color: '#98A1A4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            },
            input: {
              width: '100px',
              fontSize: '14px',
              color: '#666',
              border: '0px',
              outline: 'none',
              height: '28px',
              boxShadow: 'inset 0 0 0 1px #F0F0F0',
              boxSizing: 'content-box',
              borderRadius: '0 4px 4px 0',
              float: 'left',
              paddingLeft: '8px',
            },
            swatch: {
              width: '30px',
              height: '30px',
              float: 'left',
              borderRadius: '4px',
              margin: '0 6px 6px 0',
            },
            clear: {clear: 'both'},
          },
          'hide-triangle': {triangle: {display: 'none'}, triangleShadow: {display: 'none'}},
          'top-left-triangle': {
            triangle: {top: '-10px', left: '12px'},
            triangleShadow: {top: '-11px', left: '12px'},
          },
          'top-right-triangle': {
            triangle: {top: '-10px', right: '12px'},
            triangleShadow: {top: '-11px', right: '12px'},
          },
        },
        l,
      ),
      {
        'hide-triangle': s === 'hide',
        'top-left-triangle': s === 'top-left',
        'top-right-triangle': s === 'top-right',
      },
    ),
    d = function (v, b) {
      Pe(v) && t({hex: v, source: 'hex'}, b)
    }
  return p.createElement(
    'div',
    {style: h.card, className: 'twitter-picker ' + c},
    p.createElement('div', {style: h.triangleShadow}),
    p.createElement('div', {style: h.triangle}),
    p.createElement(
      'div',
      {style: h.body},
      $e(i, function (g, v) {
        return p.createElement(je, {
          key: v,
          color: g,
          hex: g,
          style: h.swatch,
          onClick: d,
          onHover: n,
          focusStyle: {boxShadow: '0 0 4px ' + g},
        })
      }),
      p.createElement('div', {style: h.hash}, '#'),
      p.createElement(U, {
        label: null,
        style: {input: h.input},
        value: a.replace('#', ''),
        onChange: d,
      }),
      p.createElement('div', {style: h.clear}),
    ),
  )
}
ss.propTypes = {
  width: P.oneOfType([P.string, P.number]),
  triangle: P.oneOf(['hide', 'top-left', 'top-right']),
  colors: P.arrayOf(P.string),
  styles: P.object,
}
ss.defaultProps = {
  width: 276,
  colors: [
    '#FF6900',
    '#FCB900',
    '#7BDCB5',
    '#00D084',
    '#8ED1FC',
    '#0693E3',
    '#ABB8C3',
    '#EB144C',
    '#F78DA7',
    '#9900EF',
  ],
  triangle: 'top-left',
  styles: {},
}
Q(ss)
var us = function (e) {
  var t = L({
    default: {
      picker: {
        width: '20px',
        height: '20px',
        borderRadius: '22px',
        border: '2px #fff solid',
        transform: 'translate(-12px, -13px)',
        background:
          'hsl(' +
          Math.round(e.hsl.h) +
          ', ' +
          Math.round(e.hsl.s * 100) +
          '%, ' +
          Math.round(e.hsl.l * 100) +
          '%)',
      },
    },
  })
  return p.createElement('div', {style: t.picker})
}
us.propTypes = {hsl: P.shape({h: P.number, s: P.number, l: P.number, a: P.number})}
us.defaultProps = {hsl: {a: 1, h: 249.94, l: 0.2, s: 0.5}}
var ls = function (e) {
  var t = L({
    default: {
      picker: {
        width: '20px',
        height: '20px',
        borderRadius: '22px',
        transform: 'translate(-10px, -7px)',
        background: 'hsl(' + Math.round(e.hsl.h) + ', 100%, 50%)',
        border: '2px white solid',
      },
    },
  })
  return p.createElement('div', {style: t.picker})
}
ls.propTypes = {hsl: P.shape({h: P.number, s: P.number, l: P.number, a: P.number})}
ls.defaultProps = {hsl: {a: 1, h: 249.94, l: 0.2, s: 0.5}}
var h1 = function (e) {
    var t = e.onChange,
      n = e.rgb,
      a = e.hsl,
      i = e.hex,
      o = e.hsv,
      s = function (d, g) {
        if (d.hex) Pe(d.hex) && t({hex: d.hex, source: 'hex'}, g)
        else if (d.rgb) {
          var v = d.rgb.split(',')
          $i(d.rgb, 'rgb') && t({r: v[0], g: v[1], b: v[2], a: 1, source: 'rgb'}, g)
        } else if (d.hsv) {
          var b = d.hsv.split(',')
          $i(d.hsv, 'hsv') &&
            ((b[2] = b[2].replace('%', '')),
            (b[1] = b[1].replace('%', '')),
            (b[0] = b[0].replace('°', '')),
            b[1] == 1 ? (b[1] = 0.01) : b[2] == 1 && (b[2] = 0.01),
            t({h: Number(b[0]), s: Number(b[1]), v: Number(b[2]), source: 'hsv'}, g))
        } else if (d.hsl) {
          var w = d.hsl.split(',')
          $i(d.hsl, 'hsl') &&
            ((w[2] = w[2].replace('%', '')),
            (w[1] = w[1].replace('%', '')),
            (w[0] = w[0].replace('°', '')),
            c[1] == 1 ? (c[1] = 0.01) : c[2] == 1 && (c[2] = 0.01),
            t({h: Number(w[0]), s: Number(w[1]), v: Number(w[2]), source: 'hsl'}, g))
        }
      },
      u = L({
        default: {
          wrap: {display: 'flex', height: '100px', marginTop: '4px'},
          fields: {width: '100%'},
          column: {paddingTop: '10px', display: 'flex', justifyContent: 'space-between'},
          double: {padding: '0px 4.4px', boxSizing: 'border-box'},
          input: {
            width: '100%',
            height: '38px',
            boxSizing: 'border-box',
            padding: '4px 10% 3px',
            textAlign: 'center',
            border: '1px solid #dadce0',
            fontSize: '11px',
            textTransform: 'lowercase',
            borderRadius: '5px',
            outline: 'none',
            fontFamily: 'Roboto,Arial,sans-serif',
          },
          input2: {
            height: '38px',
            width: '100%',
            border: '1px solid #dadce0',
            boxSizing: 'border-box',
            fontSize: '11px',
            textTransform: 'lowercase',
            borderRadius: '5px',
            outline: 'none',
            paddingLeft: '10px',
            fontFamily: 'Roboto,Arial,sans-serif',
          },
          label: {
            textAlign: 'center',
            fontSize: '12px',
            background: '#fff',
            position: 'absolute',
            textTransform: 'uppercase',
            color: '#3c4043',
            width: '35px',
            top: '-6px',
            left: '0',
            right: '0',
            marginLeft: 'auto',
            marginRight: 'auto',
            fontFamily: 'Roboto,Arial,sans-serif',
          },
          label2: {
            left: '10px',
            textAlign: 'center',
            fontSize: '12px',
            background: '#fff',
            position: 'absolute',
            textTransform: 'uppercase',
            color: '#3c4043',
            width: '32px',
            top: '-6px',
            fontFamily: 'Roboto,Arial,sans-serif',
          },
          single: {flexGrow: '1', margin: '0px 4.4px'},
        },
      }),
      l = n.r + ', ' + n.g + ', ' + n.b,
      f = Math.round(a.h) + '°, ' + Math.round(a.s * 100) + '%, ' + Math.round(a.l * 100) + '%',
      c = Math.round(o.h) + '°, ' + Math.round(o.s * 100) + '%, ' + Math.round(o.v * 100) + '%'
    return p.createElement(
      'div',
      {style: u.wrap, className: 'flexbox-fix'},
      p.createElement(
        'div',
        {style: u.fields},
        p.createElement(
          'div',
          {style: u.double},
          p.createElement(U, {
            style: {input: u.input, label: u.label},
            label: 'hex',
            value: i,
            onChange: s,
          }),
        ),
        p.createElement(
          'div',
          {style: u.column},
          p.createElement(
            'div',
            {style: u.single},
            p.createElement(U, {
              style: {input: u.input2, label: u.label2},
              label: 'rgb',
              value: l,
              onChange: s,
            }),
          ),
          p.createElement(
            'div',
            {style: u.single},
            p.createElement(U, {
              style: {input: u.input2, label: u.label2},
              label: 'hsv',
              value: c,
              onChange: s,
            }),
          ),
          p.createElement(
            'div',
            {style: u.single},
            p.createElement(U, {
              style: {input: u.input2, label: u.label2},
              label: 'hsl',
              value: f,
              onChange: s,
            }),
          ),
        ),
      ),
    )
  },
  fs = function (e) {
    var t = e.width,
      n = e.onChange,
      a = e.rgb,
      i = e.hsl,
      o = e.hsv,
      s = e.hex,
      u = e.header,
      l = e.styles,
      f = l === void 0 ? {} : l,
      c = e.className,
      h = c === void 0 ? '' : c,
      d = L(
        te(
          {
            default: {
              picker: {
                width: t,
                background: '#fff',
                border: '1px solid #dfe1e5',
                boxSizing: 'initial',
                display: 'flex',
                flexWrap: 'wrap',
                borderRadius: '8px 8px 0px 0px',
              },
              head: {
                height: '57px',
                width: '100%',
                paddingTop: '16px',
                paddingBottom: '16px',
                paddingLeft: '16px',
                fontSize: '20px',
                boxSizing: 'border-box',
                fontFamily: 'Roboto-Regular,HelveticaNeue,Arial,sans-serif',
              },
              saturation: {width: '70%', padding: '0px', position: 'relative', overflow: 'hidden'},
              swatch: {
                width: '30%',
                height: '228px',
                padding: '0px',
                background: 'rgba(' + a.r + ', ' + a.g + ', ' + a.b + ', 1)',
                position: 'relative',
                overflow: 'hidden',
              },
              body: {margin: 'auto', width: '95%'},
              controls: {
                display: 'flex',
                boxSizing: 'border-box',
                height: '52px',
                paddingTop: '22px',
              },
              color: {width: '32px'},
              hue: {
                height: '8px',
                position: 'relative',
                margin: '0px 16px 0px 16px',
                width: '100%',
              },
              Hue: {radius: '2px'},
            },
          },
          f,
        ),
      )
    return p.createElement(
      'div',
      {style: d.picker, className: 'google-picker ' + h},
      p.createElement('div', {style: d.head}, u),
      p.createElement('div', {style: d.swatch}),
      p.createElement(
        'div',
        {style: d.saturation},
        p.createElement(qt, {hsl: i, hsv: o, pointer: us, onChange: n}),
      ),
      p.createElement(
        'div',
        {style: d.body},
        p.createElement(
          'div',
          {style: d.controls, className: 'flexbox-fix'},
          p.createElement(
            'div',
            {style: d.hue},
            p.createElement(_r, {style: d.Hue, hsl: i, radius: '4px', pointer: ls, onChange: n}),
          ),
        ),
        p.createElement(h1, {rgb: a, hsl: i, hex: s, hsv: o, onChange: n}),
      ),
    )
  }
fs.propTypes = {width: P.oneOfType([P.string, P.number]), styles: P.object, header: P.string}
fs.defaultProps = {width: 652, styles: {}, header: 'Color picker'}
Q(fs)
var Gi = {},
  Ve = {},
  ot = {},
  hc
function p1() {
  return (
    hc ||
      ((hc = 1),
      Object.defineProperty(ot, '__esModule', {value: !0}),
      (ot.calculateChange = function (e, t, n, a, i) {
        var o = i.clientWidth,
          s = i.clientHeight,
          u = typeof e.pageX == 'number' ? e.pageX : e.touches[0].pageX,
          l = typeof e.pageY == 'number' ? e.pageY : e.touches[0].pageY,
          f = u - (i.getBoundingClientRect().left + window.pageXOffset),
          c = l - (i.getBoundingClientRect().top + window.pageYOffset)
        if (n === 'vertical') {
          var h = void 0
          if (
            (c < 0 ? (h = 0) : c > s ? (h = 1) : (h = Math.round((c * 100) / s) / 100), t.a !== h)
          )
            return {h: t.h, s: t.s, l: t.l, a: h, source: 'rgb'}
        } else {
          var d = void 0
          if ((f < 0 ? (d = 0) : f > o ? (d = 1) : (d = Math.round((f * 100) / o) / 100), a !== d))
            return {h: t.h, s: t.s, l: t.l, a: d, source: 'rgb'}
        }
        return null
      })),
    ot
  )
}
var Xe = {},
  Or = {},
  pc
function d1() {
  if (pc) return Or
  ;((pc = 1), Object.defineProperty(Or, '__esModule', {value: !0}))
  var r = {},
    e = (Or.render = function (n, a, i, o) {
      if (typeof document > 'u' && !o) return null
      var s = o ? new o() : document.createElement('canvas')
      ;((s.width = i * 2), (s.height = i * 2))
      var u = s.getContext('2d')
      return u
        ? ((u.fillStyle = n),
          u.fillRect(0, 0, s.width, s.height),
          (u.fillStyle = a),
          u.fillRect(0, 0, i, i),
          u.translate(i, i),
          u.fillRect(0, 0, i, i),
          s.toDataURL())
        : null
    })
  return (
    (Or.get = function (n, a, i, o) {
      var s = n + '-' + a + '-' + i + (o ? '-server' : '')
      if (r[s]) return r[s]
      var u = e(n, a, i, o)
      return ((r[s] = u), u)
    }),
    Or
  )
}
var dc
function cs() {
  if (dc) return Xe
  ;((dc = 1), Object.defineProperty(Xe, '__esModule', {value: !0}), (Xe.Checkboard = void 0))
  var r =
      Object.assign ||
      function (f) {
        for (var c = 1; c < arguments.length; c++) {
          var h = arguments[c]
          for (var d in h) Object.prototype.hasOwnProperty.call(h, d) && (f[d] = h[d])
        }
        return f
      },
    e = p,
    t = u(e),
    n = Me(),
    a = u(n),
    i = d1(),
    o = s(i)
  function s(f) {
    if (f && f.__esModule) return f
    var c = {}
    if (f != null) for (var h in f) Object.prototype.hasOwnProperty.call(f, h) && (c[h] = f[h])
    return ((c.default = f), c)
  }
  function u(f) {
    return f && f.__esModule ? f : {default: f}
  }
  var l = (Xe.Checkboard = function (c) {
    var h = c.white,
      d = c.grey,
      g = c.size,
      v = c.renderers,
      b = c.borderRadius,
      w = c.boxShadow,
      _ = c.children,
      C = (0, a.default)({
        default: {
          grid: {
            borderRadius: b,
            boxShadow: w,
            absolute: '0px 0px 0px 0px',
            background: 'url(' + o.get(h, d, g, v.canvas) + ') center left',
          },
        },
      })
    return (0, e.isValidElement)(_)
      ? t.default.cloneElement(_, r({}, _.props, {style: r({}, _.props.style, C.grid)}))
      : t.default.createElement('div', {style: C.grid})
  })
  return (
    (l.defaultProps = {size: 8, white: 'transparent', grey: 'rgba(0,0,0,.08)', renderers: {}}),
    (Xe.default = l),
    Xe
  )
}
var gc
function g1() {
  if (gc) return Ve
  ;((gc = 1), Object.defineProperty(Ve, '__esModule', {value: !0}), (Ve.Alpha = void 0))
  var r =
      Object.assign ||
      function (b) {
        for (var w = 1; w < arguments.length; w++) {
          var _ = arguments[w]
          for (var C in _) Object.prototype.hasOwnProperty.call(_, C) && (b[C] = _[C])
        }
        return b
      },
    e = (function () {
      function b(w, _) {
        for (var C = 0; C < _.length; C++) {
          var S = _[C]
          ;((S.enumerable = S.enumerable || !1),
            (S.configurable = !0),
            'value' in S && (S.writable = !0),
            Object.defineProperty(w, S.key, S))
        }
      }
      return function (w, _, C) {
        return (_ && b(w.prototype, _), C && b(w, C), w)
      }
    })(),
    t = p,
    n = c(t),
    a = Me(),
    i = c(a),
    o = p1(),
    s = f(o),
    u = cs(),
    l = c(u)
  function f(b) {
    if (b && b.__esModule) return b
    var w = {}
    if (b != null) for (var _ in b) Object.prototype.hasOwnProperty.call(b, _) && (w[_] = b[_])
    return ((w.default = b), w)
  }
  function c(b) {
    return b && b.__esModule ? b : {default: b}
  }
  function h(b, w) {
    if (!(b instanceof w)) throw new TypeError('Cannot call a class as a function')
  }
  function d(b, w) {
    if (!b) throw new ReferenceError("this hasn't been initialised - super() hasn't been called")
    return w && (typeof w == 'object' || typeof w == 'function') ? w : b
  }
  function g(b, w) {
    if (typeof w != 'function' && w !== null)
      throw new TypeError('Super expression must either be null or a function, not ' + typeof w)
    ;((b.prototype = Object.create(w && w.prototype, {
      constructor: {value: b, enumerable: !1, writable: !0, configurable: !0},
    })),
      w && (Object.setPrototypeOf ? Object.setPrototypeOf(b, w) : (b.__proto__ = w)))
  }
  var v = (Ve.Alpha = (function (b) {
    g(w, b)
    function w() {
      var _, C, S, E
      h(this, w)
      for (var R = arguments.length, A = Array(R), T = 0; T < R; T++) A[T] = arguments[T]
      return (
        (E =
          ((C =
            ((S = d(
              this,
              (_ = w.__proto__ || Object.getPrototypeOf(w)).call.apply(_, [this].concat(A)),
            )),
            S)),
          (S.handleChange = function (I) {
            var D = s.calculateChange(I, S.props.hsl, S.props.direction, S.props.a, S.container)
            D && typeof S.props.onChange == 'function' && S.props.onChange(D, I)
          }),
          (S.handleMouseDown = function (I) {
            ;(S.handleChange(I),
              window.addEventListener('mousemove', S.handleChange),
              window.addEventListener('mouseup', S.handleMouseUp))
          }),
          (S.handleMouseUp = function () {
            S.unbindEventListeners()
          }),
          (S.unbindEventListeners = function () {
            ;(window.removeEventListener('mousemove', S.handleChange),
              window.removeEventListener('mouseup', S.handleMouseUp))
          }),
          C)),
        d(S, E)
      )
    }
    return (
      e(w, [
        {
          key: 'componentWillUnmount',
          value: function () {
            this.unbindEventListeners()
          },
        },
        {
          key: 'render',
          value: function () {
            var C = this,
              S = this.props.rgb,
              E = (0, i.default)(
                {
                  default: {
                    alpha: {absolute: '0px 0px 0px 0px', borderRadius: this.props.radius},
                    checkboard: {
                      absolute: '0px 0px 0px 0px',
                      overflow: 'hidden',
                      borderRadius: this.props.radius,
                    },
                    gradient: {
                      absolute: '0px 0px 0px 0px',
                      background:
                        'linear-gradient(to right, rgba(' +
                        S.r +
                        ',' +
                        S.g +
                        ',' +
                        S.b +
                        `, 0) 0%,
           rgba(` +
                        S.r +
                        ',' +
                        S.g +
                        ',' +
                        S.b +
                        ', 1) 100%)',
                      boxShadow: this.props.shadow,
                      borderRadius: this.props.radius,
                    },
                    container: {position: 'relative', height: '100%', margin: '0 3px'},
                    pointer: {position: 'absolute', left: S.a * 100 + '%'},
                    slider: {
                      width: '4px',
                      borderRadius: '1px',
                      height: '8px',
                      boxShadow: '0 0 2px rgba(0, 0, 0, .6)',
                      background: '#fff',
                      marginTop: '1px',
                      transform: 'translateX(-2px)',
                    },
                  },
                  vertical: {
                    gradient: {
                      background:
                        'linear-gradient(to bottom, rgba(' +
                        S.r +
                        ',' +
                        S.g +
                        ',' +
                        S.b +
                        `, 0) 0%,
           rgba(` +
                        S.r +
                        ',' +
                        S.g +
                        ',' +
                        S.b +
                        ', 1) 100%)',
                    },
                    pointer: {left: 0, top: S.a * 100 + '%'},
                  },
                  overwrite: r({}, this.props.style),
                },
                {vertical: this.props.direction === 'vertical', overwrite: !0},
              )
            return n.default.createElement(
              'div',
              {style: E.alpha},
              n.default.createElement(
                'div',
                {style: E.checkboard},
                n.default.createElement(l.default, {renderers: this.props.renderers}),
              ),
              n.default.createElement('div', {style: E.gradient}),
              n.default.createElement(
                'div',
                {
                  style: E.container,
                  ref: function (A) {
                    return (C.container = A)
                  },
                  onMouseDown: this.handleMouseDown,
                  onTouchMove: this.handleChange,
                  onTouchStart: this.handleChange,
                },
                n.default.createElement(
                  'div',
                  {style: E.pointer},
                  this.props.pointer
                    ? n.default.createElement(this.props.pointer, this.props)
                    : n.default.createElement('div', {style: E.slider}),
                ),
              ),
            )
          },
        },
      ]),
      w
    )
  })(t.PureComponent || t.Component))
  return ((Ve.default = v), Ve)
}
var Ye = {},
  vc
function v1() {
  if (vc) return Ye
  ;((vc = 1), Object.defineProperty(Ye, '__esModule', {value: !0}), (Ye.EditableInput = void 0))
  var r = (function () {
      function _(C, S) {
        for (var E = 0; E < S.length; E++) {
          var R = S[E]
          ;((R.enumerable = R.enumerable || !1),
            (R.configurable = !0),
            'value' in R && (R.writable = !0),
            Object.defineProperty(C, R.key, R))
        }
      }
      return function (C, S, E) {
        return (S && _(C.prototype, S), E && _(C, E), C)
      }
    })(),
    e = p,
    t = i(e),
    n = Me(),
    a = i(n)
  function i(_) {
    return _ && _.__esModule ? _ : {default: _}
  }
  function o(_, C, S) {
    return (
      C in _
        ? Object.defineProperty(_, C, {value: S, enumerable: !0, configurable: !0, writable: !0})
        : (_[C] = S),
      _
    )
  }
  function s(_, C) {
    if (!(_ instanceof C)) throw new TypeError('Cannot call a class as a function')
  }
  function u(_, C) {
    if (!_) throw new ReferenceError("this hasn't been initialised - super() hasn't been called")
    return C && (typeof C == 'object' || typeof C == 'function') ? C : _
  }
  function l(_, C) {
    if (typeof C != 'function' && C !== null)
      throw new TypeError('Super expression must either be null or a function, not ' + typeof C)
    ;((_.prototype = Object.create(C && C.prototype, {
      constructor: {value: _, enumerable: !1, writable: !0, configurable: !0},
    })),
      C && (Object.setPrototypeOf ? Object.setPrototypeOf(_, C) : (_.__proto__ = C)))
  }
  var f = 1,
    c = 38,
    h = 40,
    d = [c, h],
    g = function (C) {
      return d.indexOf(C) > -1
    },
    v = function (C) {
      return Number(String(C).replace(/%/g, ''))
    },
    b = 1,
    w = (Ye.EditableInput = (function (_) {
      l(C, _)
      function C(S) {
        s(this, C)
        var E = u(this, (C.__proto__ || Object.getPrototypeOf(C)).call(this))
        return (
          (E.handleBlur = function () {
            E.state.blurValue && E.setState({value: E.state.blurValue, blurValue: null})
          }),
          (E.handleChange = function (R) {
            E.setUpdatedValue(R.target.value, R)
          }),
          (E.handleKeyDown = function (R) {
            var A = v(R.target.value)
            if (!isNaN(A) && g(R.keyCode)) {
              var T = E.getArrowOffset(),
                I = R.keyCode === c ? A + T : A - T
              E.setUpdatedValue(I, R)
            }
          }),
          (E.handleDrag = function (R) {
            if (E.props.dragLabel) {
              var A = Math.round(E.props.value + R.movementX)
              A >= 0 &&
                A <= E.props.dragMax &&
                E.props.onChange &&
                E.props.onChange(E.getValueObjectWithLabel(A), R)
            }
          }),
          (E.handleMouseDown = function (R) {
            E.props.dragLabel &&
              (R.preventDefault(),
              E.handleDrag(R),
              window.addEventListener('mousemove', E.handleDrag),
              window.addEventListener('mouseup', E.handleMouseUp))
          }),
          (E.handleMouseUp = function () {
            E.unbindEventListeners()
          }),
          (E.unbindEventListeners = function () {
            ;(window.removeEventListener('mousemove', E.handleDrag),
              window.removeEventListener('mouseup', E.handleMouseUp))
          }),
          (E.state = {
            value: String(S.value).toUpperCase(),
            blurValue: String(S.value).toUpperCase(),
          }),
          (E.inputId = 'rc-editable-input-' + b++),
          E
        )
      }
      return (
        r(C, [
          {
            key: 'componentDidUpdate',
            value: function (E, R) {
              this.props.value !== this.state.value &&
                (E.value !== this.props.value || R.value !== this.state.value) &&
                (this.input === document.activeElement
                  ? this.setState({blurValue: String(this.props.value).toUpperCase()})
                  : this.setState({
                      value: String(this.props.value).toUpperCase(),
                      blurValue: !this.state.blurValue && String(this.props.value).toUpperCase(),
                    }))
            },
          },
          {
            key: 'componentWillUnmount',
            value: function () {
              this.unbindEventListeners()
            },
          },
          {
            key: 'getValueObjectWithLabel',
            value: function (E) {
              return o({}, this.props.label, E)
            },
          },
          {
            key: 'getArrowOffset',
            value: function () {
              return this.props.arrowOffset || f
            },
          },
          {
            key: 'setUpdatedValue',
            value: function (E, R) {
              var A = this.props.label ? this.getValueObjectWithLabel(E) : E
              ;(this.props.onChange && this.props.onChange(A, R), this.setState({value: E}))
            },
          },
          {
            key: 'render',
            value: function () {
              var E = this,
                R = (0, a.default)(
                  {
                    default: {wrap: {position: 'relative'}},
                    'user-override': {
                      wrap: this.props.style && this.props.style.wrap ? this.props.style.wrap : {},
                      input:
                        this.props.style && this.props.style.input ? this.props.style.input : {},
                      label:
                        this.props.style && this.props.style.label ? this.props.style.label : {},
                    },
                    'dragLabel-true': {label: {cursor: 'ew-resize'}},
                  },
                  {'user-override': !0},
                  this.props,
                )
              return t.default.createElement(
                'div',
                {style: R.wrap},
                t.default.createElement('input', {
                  id: this.inputId,
                  style: R.input,
                  ref: function (T) {
                    return (E.input = T)
                  },
                  value: this.state.value,
                  onKeyDown: this.handleKeyDown,
                  onChange: this.handleChange,
                  onBlur: this.handleBlur,
                  placeholder: this.props.placeholder,
                  spellCheck: 'false',
                }),
                this.props.label && !this.props.hideLabel
                  ? t.default.createElement(
                      'label',
                      {htmlFor: this.inputId, style: R.label, onMouseDown: this.handleMouseDown},
                      this.props.label,
                    )
                  : null,
              )
            },
          },
        ]),
        C
      )
    })(e.PureComponent || e.Component))
  return ((Ye.default = w), Ye)
}
var Ze = {},
  st = {},
  bc
function b1() {
  return (
    bc ||
      ((bc = 1),
      Object.defineProperty(st, '__esModule', {value: !0}),
      (st.calculateChange = function (e, t, n, a) {
        var i = a.clientWidth,
          o = a.clientHeight,
          s = typeof e.pageX == 'number' ? e.pageX : e.touches[0].pageX,
          u = typeof e.pageY == 'number' ? e.pageY : e.touches[0].pageY,
          l = s - (a.getBoundingClientRect().left + window.pageXOffset),
          f = u - (a.getBoundingClientRect().top + window.pageYOffset)
        if (t === 'vertical') {
          var c = void 0
          if (f < 0) c = 359
          else if (f > o) c = 0
          else {
            var h = -((f * 100) / o) + 100
            c = (360 * h) / 100
          }
          if (n.h !== c) return {h: c, s: n.s, l: n.l, a: n.a, source: 'hsl'}
        } else {
          var d = void 0
          if (l < 0) d = 0
          else if (l > i) d = 359
          else {
            var g = (l * 100) / i
            d = (360 * g) / 100
          }
          if (n.h !== d) return {h: d, s: n.s, l: n.l, a: n.a, source: 'hsl'}
        }
        return null
      })),
    st
  )
}
var yc
function y1() {
  if (yc) return Ze
  ;((yc = 1), Object.defineProperty(Ze, '__esModule', {value: !0}), (Ze.Hue = void 0))
  var r = (function () {
      function d(g, v) {
        for (var b = 0; b < v.length; b++) {
          var w = v[b]
          ;((w.enumerable = w.enumerable || !1),
            (w.configurable = !0),
            'value' in w && (w.writable = !0),
            Object.defineProperty(g, w.key, w))
        }
      }
      return function (g, v, b) {
        return (v && d(g.prototype, v), b && d(g, b), g)
      }
    })(),
    e = p,
    t = u(e),
    n = Me(),
    a = u(n),
    i = b1(),
    o = s(i)
  function s(d) {
    if (d && d.__esModule) return d
    var g = {}
    if (d != null) for (var v in d) Object.prototype.hasOwnProperty.call(d, v) && (g[v] = d[v])
    return ((g.default = d), g)
  }
  function u(d) {
    return d && d.__esModule ? d : {default: d}
  }
  function l(d, g) {
    if (!(d instanceof g)) throw new TypeError('Cannot call a class as a function')
  }
  function f(d, g) {
    if (!d) throw new ReferenceError("this hasn't been initialised - super() hasn't been called")
    return g && (typeof g == 'object' || typeof g == 'function') ? g : d
  }
  function c(d, g) {
    if (typeof g != 'function' && g !== null)
      throw new TypeError('Super expression must either be null or a function, not ' + typeof g)
    ;((d.prototype = Object.create(g && g.prototype, {
      constructor: {value: d, enumerable: !1, writable: !0, configurable: !0},
    })),
      g && (Object.setPrototypeOf ? Object.setPrototypeOf(d, g) : (d.__proto__ = g)))
  }
  var h = (Ze.Hue = (function (d) {
    c(g, d)
    function g() {
      var v, b, w, _
      l(this, g)
      for (var C = arguments.length, S = Array(C), E = 0; E < C; E++) S[E] = arguments[E]
      return (
        (_ =
          ((b =
            ((w = f(
              this,
              (v = g.__proto__ || Object.getPrototypeOf(g)).call.apply(v, [this].concat(S)),
            )),
            w)),
          (w.handleChange = function (R) {
            var A = o.calculateChange(R, w.props.direction, w.props.hsl, w.container)
            A && typeof w.props.onChange == 'function' && w.props.onChange(A, R)
          }),
          (w.handleMouseDown = function (R) {
            ;(w.handleChange(R),
              window.addEventListener('mousemove', w.handleChange),
              window.addEventListener('mouseup', w.handleMouseUp))
          }),
          (w.handleMouseUp = function () {
            w.unbindEventListeners()
          }),
          b)),
        f(w, _)
      )
    }
    return (
      r(g, [
        {
          key: 'componentWillUnmount',
          value: function () {
            this.unbindEventListeners()
          },
        },
        {
          key: 'unbindEventListeners',
          value: function () {
            ;(window.removeEventListener('mousemove', this.handleChange),
              window.removeEventListener('mouseup', this.handleMouseUp))
          },
        },
        {
          key: 'render',
          value: function () {
            var b = this,
              w = this.props.direction,
              _ = w === void 0 ? 'horizontal' : w,
              C = (0, a.default)(
                {
                  default: {
                    hue: {
                      absolute: '0px 0px 0px 0px',
                      borderRadius: this.props.radius,
                      boxShadow: this.props.shadow,
                    },
                    container: {
                      padding: '0 2px',
                      position: 'relative',
                      height: '100%',
                      borderRadius: this.props.radius,
                    },
                    pointer: {position: 'absolute', left: (this.props.hsl.h * 100) / 360 + '%'},
                    slider: {
                      marginTop: '1px',
                      width: '4px',
                      borderRadius: '1px',
                      height: '8px',
                      boxShadow: '0 0 2px rgba(0, 0, 0, .6)',
                      background: '#fff',
                      transform: 'translateX(-2px)',
                    },
                  },
                  vertical: {
                    pointer: {left: '0px', top: -((this.props.hsl.h * 100) / 360) + 100 + '%'},
                  },
                },
                {vertical: _ === 'vertical'},
              )
            return t.default.createElement(
              'div',
              {style: C.hue},
              t.default.createElement(
                'div',
                {
                  className: 'hue-' + _,
                  style: C.container,
                  ref: function (E) {
                    return (b.container = E)
                  },
                  onMouseDown: this.handleMouseDown,
                  onTouchMove: this.handleChange,
                  onTouchStart: this.handleChange,
                },
                t.default.createElement(
                  'style',
                  null,
                  `
            .hue-horizontal {
              background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0
                33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
              background: -webkit-linear-gradient(to right, #f00 0%, #ff0
                17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
            }

            .hue-vertical {
              background: linear-gradient(to top, #f00 0%, #ff0 17%, #0f0 33%,
                #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
              background: -webkit-linear-gradient(to top, #f00 0%, #ff0 17%,
                #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
            }
          `,
                ),
                t.default.createElement(
                  'div',
                  {style: C.pointer},
                  this.props.pointer
                    ? t.default.createElement(this.props.pointer, this.props)
                    : t.default.createElement('div', {style: C.slider}),
                ),
              ),
            )
          },
        },
      ]),
      g
    )
  })(e.PureComponent || e.Component))
  return ((Ze.default = h), Ze)
}
var Je = {},
  Ui,
  mc
function op() {
  if (mc) return Ui
  mc = 1
  var r = Ho(),
    e = Ur()
  function t(n, a, i) {
    ;((i !== void 0 && !e(n[a], i)) || (i === void 0 && !(a in n))) && r(n, a, i)
  }
  return ((Ui = t), Ui)
}
var zi, xc
function m1() {
  if (xc) return zi
  xc = 1
  var r = mr(),
    e = me()
  function t(n) {
    return e(n) && r(n)
  }
  return ((zi = t), zi)
}
var Wi, _c
function sp() {
  if (_c) return Wi
  _c = 1
  function r(e, t) {
    if (!(t === 'constructor' && typeof e[t] == 'function') && t != '__proto__') return e[t]
  }
  return ((Wi = r), Wi)
}
var Ki, wc
function x1() {
  if (wc) return Ki
  wc = 1
  var r = zr(),
    e = Wr()
  function t(n) {
    return r(n, e(n))
  }
  return ((Ki = t), Ki)
}
var Vi, Sc
function _1() {
  if (Sc) return Vi
  Sc = 1
  var r = op(),
    e = Eh(),
    t = Ah(),
    n = Rh(),
    a = Th(),
    i = wo(),
    o = se(),
    s = m1(),
    u = yt(),
    l = To(),
    f = fe(),
    c = sh(),
    h = Oo(),
    d = sp(),
    g = x1()
  function v(b, w, _, C, S, E, R) {
    var A = d(b, _),
      T = d(w, _),
      I = R.get(T)
    if (I) {
      r(b, _, I)
      return
    }
    var D = E ? E(A, T, _ + '', b, w, R) : void 0,
      k = D === void 0
    if (k) {
      var N = o(T),
        j = !N && u(T),
        V = !N && !j && h(T)
      ;((D = T),
        N || j || V
          ? o(A)
            ? (D = A)
            : s(A)
              ? (D = n(A))
              : j
                ? ((k = !1), (D = e(T, !0)))
                : V
                  ? ((k = !1), (D = t(T, !0)))
                  : (D = [])
          : c(T) || i(T)
            ? ((D = A), i(A) ? (D = g(A)) : (!f(A) || l(A)) && (D = a(T)))
            : (k = !1))
    }
    ;(k && (R.set(T, D), S(D, T, C, E, R), R.delete(T)), r(b, _, D))
  }
  return ((Vi = v), Vi)
}
var Xi, Cc
function w1() {
  if (Cc) return Xi
  Cc = 1
  var r = Ct(),
    e = op(),
    t = th(),
    n = _1(),
    a = fe(),
    i = Wr(),
    o = sp()
  function s(u, l, f, c, h) {
    u !== l &&
      t(
        l,
        function (d, g) {
          if ((h || (h = new r()), a(d))) n(u, l, g, f, s, c, h)
          else {
            var v = c ? c(o(u, g), d, g + '', u, l, h) : void 0
            ;(v === void 0 && (v = d), e(u, g, v))
          }
        },
        i,
      )
  }
  return ((Xi = s), Xi)
}
var Yi, Ec
function S1() {
  if (Ec) return Yi
  Ec = 1
  function r(e, t, n) {
    switch (n.length) {
      case 0:
        return e.call(t)
      case 1:
        return e.call(t, n[0])
      case 2:
        return e.call(t, n[0], n[1])
      case 3:
        return e.call(t, n[0], n[1], n[2])
    }
    return e.apply(t, n)
  }
  return ((Yi = r), Yi)
}
var Zi, Rc
function C1() {
  if (Rc) return Zi
  Rc = 1
  var r = S1(),
    e = Math.max
  function t(n, a, i) {
    return (
      (a = e(a === void 0 ? n.length - 1 : a, 0)),
      function () {
        for (var o = arguments, s = -1, u = e(o.length - a, 0), l = Array(u); ++s < u; )
          l[s] = o[a + s]
        s = -1
        for (var f = Array(a + 1); ++s < a; ) f[s] = o[s]
        return ((f[a] = i(l)), r(n, this, f))
      }
    )
  }
  return ((Zi = t), Zi)
}
var Ji, Oc
function E1() {
  if (Oc) return Ji
  Oc = 1
  function r(e) {
    return function () {
      return e
    }
  }
  return ((Ji = r), Ji)
}
var Qi, Ac
function R1() {
  if (Ac) return Qi
  Ac = 1
  var r = E1(),
    e = Sh(),
    t = mt(),
    n = e
      ? function (a, i) {
          return e(a, 'toString', {configurable: !0, enumerable: !1, value: r(i), writable: !0})
        }
      : t
  return ((Qi = n), Qi)
}
var eo, Tc
function O1() {
  if (Tc) return eo
  Tc = 1
  var r = 800,
    e = 16,
    t = Date.now
  function n(a) {
    var i = 0,
      o = 0
    return function () {
      var s = t(),
        u = e - (s - o)
      if (((o = s), u > 0)) {
        if (++i >= r) return arguments[0]
      } else i = 0
      return a.apply(void 0, arguments)
    }
  }
  return ((eo = n), eo)
}
var ro, Mc
function A1() {
  if (Mc) return ro
  Mc = 1
  var r = R1(),
    e = O1(),
    t = e(r)
  return ((ro = t), ro)
}
var to, Pc
function T1() {
  if (Pc) return to
  Pc = 1
  var r = mt(),
    e = C1(),
    t = A1()
  function n(a, i) {
    return t(e(a, i, r), a + '')
  }
  return ((to = n), to)
}
var no, qc
function M1() {
  if (qc) return no
  qc = 1
  var r = Ur(),
    e = mr(),
    t = So(),
    n = fe()
  function a(i, o, s) {
    if (!n(s)) return !1
    var u = typeof o
    return (u == 'number' ? e(s) && t(o, s.length) : u == 'string' && o in s) ? r(s[o], i) : !1
  }
  return ((no = a), no)
}
var ao, kc
function P1() {
  if (kc) return ao
  kc = 1
  var r = T1(),
    e = M1()
  function t(n) {
    return r(function (a, i) {
      var o = -1,
        s = i.length,
        u = s > 1 ? i[s - 1] : void 0,
        l = s > 2 ? i[2] : void 0
      for (
        u = n.length > 3 && typeof u == 'function' ? (s--, u) : void 0,
          l && e(i[0], i[1], l) && ((u = s < 3 ? void 0 : u), (s = 1)),
          a = Object(a);
        ++o < s;

      ) {
        var f = i[o]
        f && n(a, f, o, u)
      }
      return a
    })
  }
  return ((ao = t), ao)
}
var io, Ic
function q1() {
  if (Ic) return io
  Ic = 1
  var r = w1(),
    e = P1(),
    t = e(function (n, a, i) {
      r(n, a, i)
    })
  return ((io = t), io)
}
var Fc
function k1() {
  if (Fc) return Je
  ;((Fc = 1), Object.defineProperty(Je, '__esModule', {value: !0}), (Je.Raised = void 0))
  var r = p,
    e = u(r),
    t = Ph(),
    n = u(t),
    a = Me(),
    i = u(a),
    o = q1(),
    s = u(o)
  function u(f) {
    return f && f.__esModule ? f : {default: f}
  }
  var l = (Je.Raised = function (c) {
    var h = c.zDepth,
      d = c.radius,
      g = c.background,
      v = c.children,
      b = c.styles,
      w = b === void 0 ? {} : b,
      _ = (0, i.default)(
        (0, s.default)(
          {
            default: {
              wrap: {position: 'relative', display: 'inline-block'},
              content: {position: 'relative'},
              bg: {
                absolute: '0px 0px 0px 0px',
                boxShadow: '0 ' + h + 'px ' + h * 4 + 'px rgba(0,0,0,.24)',
                borderRadius: d,
                background: g,
              },
            },
            'zDepth-0': {bg: {boxShadow: 'none'}},
            'zDepth-1': {bg: {boxShadow: '0 2px 10px rgba(0,0,0,.12), 0 2px 5px rgba(0,0,0,.16)'}},
            'zDepth-2': {bg: {boxShadow: '0 6px 20px rgba(0,0,0,.19), 0 8px 17px rgba(0,0,0,.2)'}},
            'zDepth-3': {
              bg: {boxShadow: '0 17px 50px rgba(0,0,0,.19), 0 12px 15px rgba(0,0,0,.24)'},
            },
            'zDepth-4': {
              bg: {boxShadow: '0 25px 55px rgba(0,0,0,.21), 0 16px 28px rgba(0,0,0,.22)'},
            },
            'zDepth-5': {
              bg: {boxShadow: '0 40px 77px rgba(0,0,0,.22), 0 27px 24px rgba(0,0,0,.2)'},
            },
            square: {bg: {borderRadius: '0'}},
            circle: {bg: {borderRadius: '50%'}},
          },
          w,
        ),
        {'zDepth-1': h === 1},
      )
    return e.default.createElement(
      'div',
      {style: _.wrap},
      e.default.createElement('div', {style: _.bg}),
      e.default.createElement('div', {style: _.content}, v),
    )
  })
  return (
    (l.propTypes = {
      background: n.default.string,
      zDepth: n.default.oneOf([0, 1, 2, 3, 4, 5]),
      radius: n.default.number,
      styles: n.default.object,
    }),
    (l.defaultProps = {background: '#fff', zDepth: 1, radius: 2, styles: {}}),
    (Je.default = l),
    Je
  )
}
var Qe = {},
  oo,
  Hc
function I1() {
  if (Hc) return oo
  Hc = 1
  var r = ge(),
    e = function () {
      return r.Date.now()
    }
  return ((oo = e), oo)
}
var so, Dc
function F1() {
  if (Dc) return so
  Dc = 1
  var r = /\s/
  function e(t) {
    for (var n = t.length; n-- && r.test(t.charAt(n)); );
    return n
  }
  return ((so = e), so)
}
var uo, Lc
function H1() {
  if (Lc) return uo
  Lc = 1
  var r = F1(),
    e = /^\s+/
  function t(n) {
    return n && n.slice(0, r(n) + 1).replace(e, '')
  }
  return ((uo = t), uo)
}
var lo, Bc
function D1() {
  if (Bc) return lo
  Bc = 1
  var r = H1(),
    e = fe(),
    t = Rt(),
    n = NaN,
    a = /^[-+]0x[0-9a-f]+$/i,
    i = /^0b[01]+$/i,
    o = /^0o[0-7]+$/i,
    s = parseInt
  function u(l) {
    if (typeof l == 'number') return l
    if (t(l)) return n
    if (e(l)) {
      var f = typeof l.valueOf == 'function' ? l.valueOf() : l
      l = e(f) ? f + '' : f
    }
    if (typeof l != 'string') return l === 0 ? l : +l
    l = r(l)
    var c = i.test(l)
    return c || o.test(l) ? s(l.slice(2), c ? 2 : 8) : a.test(l) ? n : +l
  }
  return ((lo = u), lo)
}
var fo, jc
function up() {
  if (jc) return fo
  jc = 1
  var r = fe(),
    e = I1(),
    t = D1(),
    n = 'Expected a function',
    a = Math.max,
    i = Math.min
  function o(s, u, l) {
    var f,
      c,
      h,
      d,
      g,
      v,
      b = 0,
      w = !1,
      _ = !1,
      C = !0
    if (typeof s != 'function') throw new TypeError(n)
    ;((u = t(u) || 0),
      r(l) &&
        ((w = !!l.leading),
        (_ = 'maxWait' in l),
        (h = _ ? a(t(l.maxWait) || 0, u) : h),
        (C = 'trailing' in l ? !!l.trailing : C)))
    function S(j) {
      var V = f,
        B = c
      return ((f = c = void 0), (b = j), (d = s.apply(B, V)), d)
    }
    function E(j) {
      return ((b = j), (g = setTimeout(T, u)), w ? S(j) : d)
    }
    function R(j) {
      var V = j - v,
        B = j - b,
        ce = u - V
      return _ ? i(ce, h - B) : ce
    }
    function A(j) {
      var V = j - v,
        B = j - b
      return v === void 0 || V >= u || V < 0 || (_ && B >= h)
    }
    function T() {
      var j = e()
      if (A(j)) return I(j)
      g = setTimeout(T, R(j))
    }
    function I(j) {
      return ((g = void 0), C && f ? S(j) : ((f = c = void 0), d))
    }
    function D() {
      ;(g !== void 0 && clearTimeout(g), (b = 0), (f = v = c = g = void 0))
    }
    function k() {
      return g === void 0 ? d : I(e())
    }
    function N() {
      var j = e(),
        V = A(j)
      if (((f = arguments), (c = this), (v = j), V)) {
        if (g === void 0) return E(v)
        if (_) return (clearTimeout(g), (g = setTimeout(T, u)), S(v))
      }
      return (g === void 0 && (g = setTimeout(T, u)), d)
    }
    return ((N.cancel = D), (N.flush = k), N)
  }
  return ((fo = o), fo)
}
var co, $c
function L1() {
  if ($c) return co
  $c = 1
  var r = up(),
    e = fe(),
    t = 'Expected a function'
  function n(a, i, o) {
    var s = !0,
      u = !0
    if (typeof a != 'function') throw new TypeError(t)
    return (
      e(o) && ((s = 'leading' in o ? !!o.leading : s), (u = 'trailing' in o ? !!o.trailing : u)),
      r(a, i, {leading: s, maxWait: i, trailing: u})
    )
  }
  return ((co = n), co)
}
var ut = {},
  Nc
function B1() {
  return (
    Nc ||
      ((Nc = 1),
      Object.defineProperty(ut, '__esModule', {value: !0}),
      (ut.calculateChange = function (e, t, n) {
        var a = n.getBoundingClientRect(),
          i = a.width,
          o = a.height,
          s = typeof e.pageX == 'number' ? e.pageX : e.touches[0].pageX,
          u = typeof e.pageY == 'number' ? e.pageY : e.touches[0].pageY,
          l = s - (n.getBoundingClientRect().left + window.pageXOffset),
          f = u - (n.getBoundingClientRect().top + window.pageYOffset)
        ;(l < 0 ? (l = 0) : l > i && (l = i), f < 0 ? (f = 0) : f > o && (f = o))
        var c = l / i,
          h = 1 - f / o
        return {h: t.h, s: c, v: h, a: t.a, source: 'hsv'}
      })),
    ut
  )
}
var Gc
function j1() {
  if (Gc) return Qe
  ;((Gc = 1), Object.defineProperty(Qe, '__esModule', {value: !0}), (Qe.Saturation = void 0))
  var r = (function () {
      function v(b, w) {
        for (var _ = 0; _ < w.length; _++) {
          var C = w[_]
          ;((C.enumerable = C.enumerable || !1),
            (C.configurable = !0),
            'value' in C && (C.writable = !0),
            Object.defineProperty(b, C.key, C))
        }
      }
      return function (b, w, _) {
        return (w && v(b.prototype, w), _ && v(b, _), b)
      }
    })(),
    e = p,
    t = f(e),
    n = Me(),
    a = f(n),
    i = L1(),
    o = f(i),
    s = B1(),
    u = l(s)
  function l(v) {
    if (v && v.__esModule) return v
    var b = {}
    if (v != null) for (var w in v) Object.prototype.hasOwnProperty.call(v, w) && (b[w] = v[w])
    return ((b.default = v), b)
  }
  function f(v) {
    return v && v.__esModule ? v : {default: v}
  }
  function c(v, b) {
    if (!(v instanceof b)) throw new TypeError('Cannot call a class as a function')
  }
  function h(v, b) {
    if (!v) throw new ReferenceError("this hasn't been initialised - super() hasn't been called")
    return b && (typeof b == 'object' || typeof b == 'function') ? b : v
  }
  function d(v, b) {
    if (typeof b != 'function' && b !== null)
      throw new TypeError('Super expression must either be null or a function, not ' + typeof b)
    ;((v.prototype = Object.create(b && b.prototype, {
      constructor: {value: v, enumerable: !1, writable: !0, configurable: !0},
    })),
      b && (Object.setPrototypeOf ? Object.setPrototypeOf(v, b) : (v.__proto__ = b)))
  }
  var g = (Qe.Saturation = (function (v) {
    d(b, v)
    function b(w) {
      c(this, b)
      var _ = h(this, (b.__proto__ || Object.getPrototypeOf(b)).call(this, w))
      return (
        (_.handleChange = function (C) {
          typeof _.props.onChange == 'function' &&
            _.throttle(_.props.onChange, u.calculateChange(C, _.props.hsl, _.container), C)
        }),
        (_.handleMouseDown = function (C) {
          _.handleChange(C)
          var S = _.getContainerRenderWindow()
          ;(S.addEventListener('mousemove', _.handleChange),
            S.addEventListener('mouseup', _.handleMouseUp))
        }),
        (_.handleMouseUp = function () {
          _.unbindEventListeners()
        }),
        (_.throttle = (0, o.default)(function (C, S, E) {
          C(S, E)
        }, 50)),
        _
      )
    }
    return (
      r(b, [
        {
          key: 'componentWillUnmount',
          value: function () {
            ;(this.throttle.cancel(), this.unbindEventListeners())
          },
        },
        {
          key: 'getContainerRenderWindow',
          value: function () {
            for (var _ = this.container, C = window; !C.document.contains(_) && C.parent !== C; )
              C = C.parent
            return C
          },
        },
        {
          key: 'unbindEventListeners',
          value: function () {
            var _ = this.getContainerRenderWindow()
            ;(_.removeEventListener('mousemove', this.handleChange),
              _.removeEventListener('mouseup', this.handleMouseUp))
          },
        },
        {
          key: 'render',
          value: function () {
            var _ = this,
              C = this.props.style || {},
              S = C.color,
              E = C.white,
              R = C.black,
              A = C.pointer,
              T = C.circle,
              I = (0, a.default)(
                {
                  default: {
                    color: {
                      absolute: '0px 0px 0px 0px',
                      background: 'hsl(' + this.props.hsl.h + ',100%, 50%)',
                      borderRadius: this.props.radius,
                    },
                    white: {absolute: '0px 0px 0px 0px', borderRadius: this.props.radius},
                    black: {
                      absolute: '0px 0px 0px 0px',
                      boxShadow: this.props.shadow,
                      borderRadius: this.props.radius,
                    },
                    pointer: {
                      position: 'absolute',
                      top: -(this.props.hsv.v * 100) + 100 + '%',
                      left: this.props.hsv.s * 100 + '%',
                      cursor: 'default',
                    },
                    circle: {
                      width: '4px',
                      height: '4px',
                      boxShadow: `0 0 0 1.5px #fff, inset 0 0 1px 1px rgba(0,0,0,.3),
            0 0 1px 2px rgba(0,0,0,.4)`,
                      borderRadius: '50%',
                      cursor: 'hand',
                      transform: 'translate(-2px, -2px)',
                    },
                  },
                  custom: {color: S, white: E, black: R, pointer: A, circle: T},
                },
                {custom: !!this.props.style},
              )
            return t.default.createElement(
              'div',
              {
                style: I.color,
                ref: function (k) {
                  return (_.container = k)
                },
                onMouseDown: this.handleMouseDown,
                onTouchMove: this.handleChange,
                onTouchStart: this.handleChange,
              },
              t.default.createElement(
                'style',
                null,
                `
          .saturation-white {
            background: -webkit-linear-gradient(to right, #fff, rgba(255,255,255,0));
            background: linear-gradient(to right, #fff, rgba(255,255,255,0));
          }
          .saturation-black {
            background: -webkit-linear-gradient(to top, #000, rgba(0,0,0,0));
            background: linear-gradient(to top, #000, rgba(0,0,0,0));
          }
        `,
              ),
              t.default.createElement(
                'div',
                {style: I.white, className: 'saturation-white'},
                t.default.createElement('div', {style: I.black, className: 'saturation-black'}),
                t.default.createElement(
                  'div',
                  {style: I.pointer},
                  this.props.pointer
                    ? t.default.createElement(this.props.pointer, this.props)
                    : t.default.createElement('div', {style: I.circle}),
                ),
              ),
            )
          },
        },
      ]),
      b
    )
  })(e.PureComponent || e.Component))
  return ((Qe.default = g), Qe)
}
var er = {},
  J = {},
  ho,
  Uc
function $1() {
  if (Uc) return ho
  Uc = 1
  var r = wh(),
    e = _h(),
    t = oh(),
    n = se()
  function a(i, o) {
    var s = n(i) ? r : e
    return s(i, t(o))
  }
  return ((ho = a), ho)
}
var po, zc
function N1() {
  return (zc || ((zc = 1), (po = $1())), po)
}
var lt = {exports: {}},
  G1 = lt.exports,
  Wc
function U1() {
  return (
    Wc ||
      ((Wc = 1),
      (function (r, e) {
        ;(function (t, n) {
          r.exports = n()
        })(G1, function () {
          function t(y) {
            '@babel/helpers - typeof'
            return (
              (t =
                typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
                  ? function (x) {
                      return typeof x
                    }
                  : function (x) {
                      return x &&
                        typeof Symbol == 'function' &&
                        x.constructor === Symbol &&
                        x !== Symbol.prototype
                        ? 'symbol'
                        : typeof x
                    }),
              t(y)
            )
          }
          var n = /^\s+/,
            a = /\s+$/
          function i(y, x) {
            if (((y = y || ''), (x = x || {}), y instanceof i)) return y
            if (!(this instanceof i)) return new i(y, x)
            var m = o(y)
            ;((this._originalInput = y),
              (this._r = m.r),
              (this._g = m.g),
              (this._b = m.b),
              (this._a = m.a),
              (this._roundA = Math.round(100 * this._a) / 100),
              (this._format = x.format || m.format),
              (this._gradientType = x.gradientType),
              this._r < 1 && (this._r = Math.round(this._r)),
              this._g < 1 && (this._g = Math.round(this._g)),
              this._b < 1 && (this._b = Math.round(this._b)),
              (this._ok = m.ok))
          }
          ;((i.prototype = {
            isDark: function () {
              return this.getBrightness() < 128
            },
            isLight: function () {
              return !this.isDark()
            },
            isValid: function () {
              return this._ok
            },
            getOriginalInput: function () {
              return this._originalInput
            },
            getFormat: function () {
              return this._format
            },
            getAlpha: function () {
              return this._a
            },
            getBrightness: function () {
              var x = this.toRgb()
              return (x.r * 299 + x.g * 587 + x.b * 114) / 1e3
            },
            getLuminance: function () {
              var x = this.toRgb(),
                m,
                O,
                q,
                M,
                z,
                H
              return (
                (m = x.r / 255),
                (O = x.g / 255),
                (q = x.b / 255),
                m <= 0.03928 ? (M = m / 12.92) : (M = Math.pow((m + 0.055) / 1.055, 2.4)),
                O <= 0.03928 ? (z = O / 12.92) : (z = Math.pow((O + 0.055) / 1.055, 2.4)),
                q <= 0.03928 ? (H = q / 12.92) : (H = Math.pow((q + 0.055) / 1.055, 2.4)),
                0.2126 * M + 0.7152 * z + 0.0722 * H
              )
            },
            setAlpha: function (x) {
              return ((this._a = V(x)), (this._roundA = Math.round(100 * this._a) / 100), this)
            },
            toHsv: function () {
              var x = f(this._r, this._g, this._b)
              return {h: x.h * 360, s: x.s, v: x.v, a: this._a}
            },
            toHsvString: function () {
              var x = f(this._r, this._g, this._b),
                m = Math.round(x.h * 360),
                O = Math.round(x.s * 100),
                q = Math.round(x.v * 100)
              return this._a == 1
                ? 'hsv(' + m + ', ' + O + '%, ' + q + '%)'
                : 'hsva(' + m + ', ' + O + '%, ' + q + '%, ' + this._roundA + ')'
            },
            toHsl: function () {
              var x = u(this._r, this._g, this._b)
              return {h: x.h * 360, s: x.s, l: x.l, a: this._a}
            },
            toHslString: function () {
              var x = u(this._r, this._g, this._b),
                m = Math.round(x.h * 360),
                O = Math.round(x.s * 100),
                q = Math.round(x.l * 100)
              return this._a == 1
                ? 'hsl(' + m + ', ' + O + '%, ' + q + '%)'
                : 'hsla(' + m + ', ' + O + '%, ' + q + '%, ' + this._roundA + ')'
            },
            toHex: function (x) {
              return h(this._r, this._g, this._b, x)
            },
            toHexString: function (x) {
              return '#' + this.toHex(x)
            },
            toHex8: function (x) {
              return d(this._r, this._g, this._b, this._a, x)
            },
            toHex8String: function (x) {
              return '#' + this.toHex8(x)
            },
            toRgb: function () {
              return {
                r: Math.round(this._r),
                g: Math.round(this._g),
                b: Math.round(this._b),
                a: this._a,
              }
            },
            toRgbString: function () {
              return this._a == 1
                ? 'rgb(' +
                    Math.round(this._r) +
                    ', ' +
                    Math.round(this._g) +
                    ', ' +
                    Math.round(this._b) +
                    ')'
                : 'rgba(' +
                    Math.round(this._r) +
                    ', ' +
                    Math.round(this._g) +
                    ', ' +
                    Math.round(this._b) +
                    ', ' +
                    this._roundA +
                    ')'
            },
            toPercentageRgb: function () {
              return {
                r: Math.round(B(this._r, 255) * 100) + '%',
                g: Math.round(B(this._g, 255) * 100) + '%',
                b: Math.round(B(this._b, 255) * 100) + '%',
                a: this._a,
              }
            },
            toPercentageRgbString: function () {
              return this._a == 1
                ? 'rgb(' +
                    Math.round(B(this._r, 255) * 100) +
                    '%, ' +
                    Math.round(B(this._g, 255) * 100) +
                    '%, ' +
                    Math.round(B(this._b, 255) * 100) +
                    '%)'
                : 'rgba(' +
                    Math.round(B(this._r, 255) * 100) +
                    '%, ' +
                    Math.round(B(this._g, 255) * 100) +
                    '%, ' +
                    Math.round(B(this._b, 255) * 100) +
                    '%, ' +
                    this._roundA +
                    ')'
            },
            toName: function () {
              return this._a === 0
                ? 'transparent'
                : this._a < 1
                  ? !1
                  : N[h(this._r, this._g, this._b, !0)] || !1
            },
            toFilter: function (x) {
              var m = '#' + g(this._r, this._g, this._b, this._a),
                O = m,
                q = this._gradientType ? 'GradientType = 1, ' : ''
              if (x) {
                var M = i(x)
                O = '#' + g(M._r, M._g, M._b, M._a)
              }
              return (
                'progid:DXImageTransform.Microsoft.gradient(' +
                q +
                'startColorstr=' +
                m +
                ',endColorstr=' +
                O +
                ')'
              )
            },
            toString: function (x) {
              var m = !!x
              x = x || this._format
              var O = !1,
                q = this._a < 1 && this._a >= 0,
                M =
                  !m &&
                  q &&
                  (x === 'hex' ||
                    x === 'hex6' ||
                    x === 'hex3' ||
                    x === 'hex4' ||
                    x === 'hex8' ||
                    x === 'name')
              return M
                ? x === 'name' && this._a === 0
                  ? this.toName()
                  : this.toRgbString()
                : (x === 'rgb' && (O = this.toRgbString()),
                  x === 'prgb' && (O = this.toPercentageRgbString()),
                  (x === 'hex' || x === 'hex6') && (O = this.toHexString()),
                  x === 'hex3' && (O = this.toHexString(!0)),
                  x === 'hex4' && (O = this.toHex8String(!0)),
                  x === 'hex8' && (O = this.toHex8String()),
                  x === 'name' && (O = this.toName()),
                  x === 'hsl' && (O = this.toHslString()),
                  x === 'hsv' && (O = this.toHsvString()),
                  O || this.toHexString())
            },
            clone: function () {
              return i(this.toString())
            },
            _applyModification: function (x, m) {
              var O = x.apply(null, [this].concat([].slice.call(m)))
              return (
                (this._r = O._r),
                (this._g = O._g),
                (this._b = O._b),
                this.setAlpha(O._a),
                this
              )
            },
            lighten: function () {
              return this._applyModification(_, arguments)
            },
            brighten: function () {
              return this._applyModification(C, arguments)
            },
            darken: function () {
              return this._applyModification(S, arguments)
            },
            desaturate: function () {
              return this._applyModification(v, arguments)
            },
            saturate: function () {
              return this._applyModification(b, arguments)
            },
            greyscale: function () {
              return this._applyModification(w, arguments)
            },
            spin: function () {
              return this._applyModification(E, arguments)
            },
            _applyCombination: function (x, m) {
              return x.apply(null, [this].concat([].slice.call(m)))
            },
            analogous: function () {
              return this._applyCombination(I, arguments)
            },
            complement: function () {
              return this._applyCombination(R, arguments)
            },
            monochromatic: function () {
              return this._applyCombination(D, arguments)
            },
            splitcomplement: function () {
              return this._applyCombination(T, arguments)
            },
            triad: function () {
              return this._applyCombination(A, [3])
            },
            tetrad: function () {
              return this._applyCombination(A, [4])
            },
          }),
            (i.fromRatio = function (y, x) {
              if (t(y) == 'object') {
                var m = {}
                for (var O in y)
                  y.hasOwnProperty(O) && (O === 'a' ? (m[O] = y[O]) : (m[O] = qe(y[O])))
                y = m
              }
              return i(y, x)
            }))
          function o(y) {
            var x = {r: 0, g: 0, b: 0},
              m = 1,
              O = null,
              q = null,
              M = null,
              z = !1,
              H = !1
            return (
              typeof y == 'string' && (y = Ht(y)),
              t(y) == 'object' &&
                (he(y.r) && he(y.g) && he(y.b)
                  ? ((x = s(y.r, y.g, y.b)),
                    (z = !0),
                    (H = String(y.r).substr(-1) === '%' ? 'prgb' : 'rgb'))
                  : he(y.h) && he(y.s) && he(y.v)
                    ? ((O = qe(y.s)), (q = qe(y.v)), (x = c(y.h, O, q)), (z = !0), (H = 'hsv'))
                    : he(y.h) &&
                      he(y.s) &&
                      he(y.l) &&
                      ((O = qe(y.s)), (M = qe(y.l)), (x = l(y.h, O, M)), (z = !0), (H = 'hsl')),
                y.hasOwnProperty('a') && (m = y.a)),
              (m = V(m)),
              {
                ok: z,
                format: y.format || H,
                r: Math.min(255, Math.max(x.r, 0)),
                g: Math.min(255, Math.max(x.g, 0)),
                b: Math.min(255, Math.max(x.b, 0)),
                a: m,
              }
            )
          }
          function s(y, x, m) {
            return {r: B(y, 255) * 255, g: B(x, 255) * 255, b: B(m, 255) * 255}
          }
          function u(y, x, m) {
            ;((y = B(y, 255)), (x = B(x, 255)), (m = B(m, 255)))
            var O = Math.max(y, x, m),
              q = Math.min(y, x, m),
              M,
              z,
              H = (O + q) / 2
            if (O == q) M = z = 0
            else {
              var W = O - q
              switch (((z = H > 0.5 ? W / (2 - O - q) : W / (O + q)), O)) {
                case y:
                  M = (x - m) / W + (x < m ? 6 : 0)
                  break
                case x:
                  M = (m - y) / W + 2
                  break
                case m:
                  M = (y - x) / W + 4
                  break
              }
              M /= 6
            }
            return {h: M, s: z, l: H}
          }
          function l(y, x, m) {
            var O, q, M
            ;((y = B(y, 360)), (x = B(x, 100)), (m = B(m, 100)))
            function z($, ue, Y) {
              return (
                Y < 0 && (Y += 1),
                Y > 1 && (Y -= 1),
                Y < 1 / 6
                  ? $ + (ue - $) * 6 * Y
                  : Y < 1 / 2
                    ? ue
                    : Y < 2 / 3
                      ? $ + (ue - $) * (2 / 3 - Y) * 6
                      : $
              )
            }
            if (x === 0) O = q = M = m
            else {
              var H = m < 0.5 ? m * (1 + x) : m + x - m * x,
                W = 2 * m - H
              ;((O = z(W, H, y + 1 / 3)), (q = z(W, H, y)), (M = z(W, H, y - 1 / 3)))
            }
            return {r: O * 255, g: q * 255, b: M * 255}
          }
          function f(y, x, m) {
            ;((y = B(y, 255)), (x = B(x, 255)), (m = B(m, 255)))
            var O = Math.max(y, x, m),
              q = Math.min(y, x, m),
              M,
              z,
              H = O,
              W = O - q
            if (((z = O === 0 ? 0 : W / O), O == q)) M = 0
            else {
              switch (O) {
                case y:
                  M = (x - m) / W + (x < m ? 6 : 0)
                  break
                case x:
                  M = (m - y) / W + 2
                  break
                case m:
                  M = (y - x) / W + 4
                  break
              }
              M /= 6
            }
            return {h: M, s: z, v: H}
          }
          function c(y, x, m) {
            ;((y = B(y, 360) * 6), (x = B(x, 100)), (m = B(m, 100)))
            var O = Math.floor(y),
              q = y - O,
              M = m * (1 - x),
              z = m * (1 - q * x),
              H = m * (1 - (1 - q) * x),
              W = O % 6,
              $ = [m, z, M, M, H, m][W],
              ue = [H, m, m, z, M, M][W],
              Y = [M, M, H, m, m, z][W]
            return {r: $ * 255, g: ue * 255, b: Y * 255}
          }
          function h(y, x, m, O) {
            var q = [
              ne(Math.round(y).toString(16)),
              ne(Math.round(x).toString(16)),
              ne(Math.round(m).toString(16)),
            ]
            return O &&
              q[0].charAt(0) == q[0].charAt(1) &&
              q[1].charAt(0) == q[1].charAt(1) &&
              q[2].charAt(0) == q[2].charAt(1)
              ? q[0].charAt(0) + q[1].charAt(0) + q[2].charAt(0)
              : q.join('')
          }
          function d(y, x, m, O, q) {
            var M = [
              ne(Math.round(y).toString(16)),
              ne(Math.round(x).toString(16)),
              ne(Math.round(m).toString(16)),
              ne(Yr(O)),
            ]
            return q &&
              M[0].charAt(0) == M[0].charAt(1) &&
              M[1].charAt(0) == M[1].charAt(1) &&
              M[2].charAt(0) == M[2].charAt(1) &&
              M[3].charAt(0) == M[3].charAt(1)
              ? M[0].charAt(0) + M[1].charAt(0) + M[2].charAt(0) + M[3].charAt(0)
              : M.join('')
          }
          function g(y, x, m, O) {
            var q = [
              ne(Yr(O)),
              ne(Math.round(y).toString(16)),
              ne(Math.round(x).toString(16)),
              ne(Math.round(m).toString(16)),
            ]
            return q.join('')
          }
          ;((i.equals = function (y, x) {
            return !y || !x ? !1 : i(y).toRgbString() == i(x).toRgbString()
          }),
            (i.random = function () {
              return i.fromRatio({r: Math.random(), g: Math.random(), b: Math.random()})
            }))
          function v(y, x) {
            x = x === 0 ? 0 : x || 10
            var m = i(y).toHsl()
            return ((m.s -= x / 100), (m.s = ce(m.s)), i(m))
          }
          function b(y, x) {
            x = x === 0 ? 0 : x || 10
            var m = i(y).toHsl()
            return ((m.s += x / 100), (m.s = ce(m.s)), i(m))
          }
          function w(y) {
            return i(y).desaturate(100)
          }
          function _(y, x) {
            x = x === 0 ? 0 : x || 10
            var m = i(y).toHsl()
            return ((m.l += x / 100), (m.l = ce(m.l)), i(m))
          }
          function C(y, x) {
            x = x === 0 ? 0 : x || 10
            var m = i(y).toRgb()
            return (
              (m.r = Math.max(0, Math.min(255, m.r - Math.round(255 * -(x / 100))))),
              (m.g = Math.max(0, Math.min(255, m.g - Math.round(255 * -(x / 100))))),
              (m.b = Math.max(0, Math.min(255, m.b - Math.round(255 * -(x / 100))))),
              i(m)
            )
          }
          function S(y, x) {
            x = x === 0 ? 0 : x || 10
            var m = i(y).toHsl()
            return ((m.l -= x / 100), (m.l = ce(m.l)), i(m))
          }
          function E(y, x) {
            var m = i(y).toHsl(),
              O = (m.h + x) % 360
            return ((m.h = O < 0 ? 360 + O : O), i(m))
          }
          function R(y) {
            var x = i(y).toHsl()
            return ((x.h = (x.h + 180) % 360), i(x))
          }
          function A(y, x) {
            if (isNaN(x) || x <= 0) throw new Error('Argument to polyad must be a positive number')
            for (var m = i(y).toHsl(), O = [i(y)], q = 360 / x, M = 1; M < x; M++)
              O.push(i({h: (m.h + M * q) % 360, s: m.s, l: m.l}))
            return O
          }
          function T(y) {
            var x = i(y).toHsl(),
              m = x.h
            return [
              i(y),
              i({h: (m + 72) % 360, s: x.s, l: x.l}),
              i({h: (m + 216) % 360, s: x.s, l: x.l}),
            ]
          }
          function I(y, x, m) {
            ;((x = x || 6), (m = m || 30))
            var O = i(y).toHsl(),
              q = 360 / m,
              M = [i(y)]
            for (O.h = (O.h - ((q * x) >> 1) + 720) % 360; --x; )
              ((O.h = (O.h + q) % 360), M.push(i(O)))
            return M
          }
          function D(y, x) {
            x = x || 6
            for (var m = i(y).toHsv(), O = m.h, q = m.s, M = m.v, z = [], H = 1 / x; x--; )
              (z.push(i({h: O, s: q, v: M})), (M = (M + H) % 1))
            return z
          }
          ;((i.mix = function (y, x, m) {
            m = m === 0 ? 0 : m || 50
            var O = i(y).toRgb(),
              q = i(x).toRgb(),
              M = m / 100,
              z = {
                r: (q.r - O.r) * M + O.r,
                g: (q.g - O.g) * M + O.g,
                b: (q.b - O.b) * M + O.b,
                a: (q.a - O.a) * M + O.a,
              }
            return i(z)
          }),
            (i.readability = function (y, x) {
              var m = i(y),
                O = i(x)
              return (
                (Math.max(m.getLuminance(), O.getLuminance()) + 0.05) /
                (Math.min(m.getLuminance(), O.getLuminance()) + 0.05)
              )
            }),
            (i.isReadable = function (y, x, m) {
              var O = i.readability(y, x),
                q,
                M
              switch (((M = !1), (q = Dt(m)), q.level + q.size)) {
                case 'AAsmall':
                case 'AAAlarge':
                  M = O >= 4.5
                  break
                case 'AAlarge':
                  M = O >= 3
                  break
                case 'AAAsmall':
                  M = O >= 7
                  break
              }
              return M
            }),
            (i.mostReadable = function (y, x, m) {
              var O = null,
                q = 0,
                M,
                z,
                H,
                W
              ;((m = m || {}), (z = m.includeFallbackColors), (H = m.level), (W = m.size))
              for (var $ = 0; $ < x.length; $++)
                ((M = i.readability(y, x[$])), M > q && ((q = M), (O = i(x[$]))))
              return i.isReadable(y, O, {level: H, size: W}) || !z
                ? O
                : ((m.includeFallbackColors = !1), i.mostReadable(y, ['#fff', '#000'], m))
            }))
          var k = (i.names = {
              aliceblue: 'f0f8ff',
              antiquewhite: 'faebd7',
              aqua: '0ff',
              aquamarine: '7fffd4',
              azure: 'f0ffff',
              beige: 'f5f5dc',
              bisque: 'ffe4c4',
              black: '000',
              blanchedalmond: 'ffebcd',
              blue: '00f',
              blueviolet: '8a2be2',
              brown: 'a52a2a',
              burlywood: 'deb887',
              burntsienna: 'ea7e5d',
              cadetblue: '5f9ea0',
              chartreuse: '7fff00',
              chocolate: 'd2691e',
              coral: 'ff7f50',
              cornflowerblue: '6495ed',
              cornsilk: 'fff8dc',
              crimson: 'dc143c',
              cyan: '0ff',
              darkblue: '00008b',
              darkcyan: '008b8b',
              darkgoldenrod: 'b8860b',
              darkgray: 'a9a9a9',
              darkgreen: '006400',
              darkgrey: 'a9a9a9',
              darkkhaki: 'bdb76b',
              darkmagenta: '8b008b',
              darkolivegreen: '556b2f',
              darkorange: 'ff8c00',
              darkorchid: '9932cc',
              darkred: '8b0000',
              darksalmon: 'e9967a',
              darkseagreen: '8fbc8f',
              darkslateblue: '483d8b',
              darkslategray: '2f4f4f',
              darkslategrey: '2f4f4f',
              darkturquoise: '00ced1',
              darkviolet: '9400d3',
              deeppink: 'ff1493',
              deepskyblue: '00bfff',
              dimgray: '696969',
              dimgrey: '696969',
              dodgerblue: '1e90ff',
              firebrick: 'b22222',
              floralwhite: 'fffaf0',
              forestgreen: '228b22',
              fuchsia: 'f0f',
              gainsboro: 'dcdcdc',
              ghostwhite: 'f8f8ff',
              gold: 'ffd700',
              goldenrod: 'daa520',
              gray: '808080',
              green: '008000',
              greenyellow: 'adff2f',
              grey: '808080',
              honeydew: 'f0fff0',
              hotpink: 'ff69b4',
              indianred: 'cd5c5c',
              indigo: '4b0082',
              ivory: 'fffff0',
              khaki: 'f0e68c',
              lavender: 'e6e6fa',
              lavenderblush: 'fff0f5',
              lawngreen: '7cfc00',
              lemonchiffon: 'fffacd',
              lightblue: 'add8e6',
              lightcoral: 'f08080',
              lightcyan: 'e0ffff',
              lightgoldenrodyellow: 'fafad2',
              lightgray: 'd3d3d3',
              lightgreen: '90ee90',
              lightgrey: 'd3d3d3',
              lightpink: 'ffb6c1',
              lightsalmon: 'ffa07a',
              lightseagreen: '20b2aa',
              lightskyblue: '87cefa',
              lightslategray: '789',
              lightslategrey: '789',
              lightsteelblue: 'b0c4de',
              lightyellow: 'ffffe0',
              lime: '0f0',
              limegreen: '32cd32',
              linen: 'faf0e6',
              magenta: 'f0f',
              maroon: '800000',
              mediumaquamarine: '66cdaa',
              mediumblue: '0000cd',
              mediumorchid: 'ba55d3',
              mediumpurple: '9370db',
              mediumseagreen: '3cb371',
              mediumslateblue: '7b68ee',
              mediumspringgreen: '00fa9a',
              mediumturquoise: '48d1cc',
              mediumvioletred: 'c71585',
              midnightblue: '191970',
              mintcream: 'f5fffa',
              mistyrose: 'ffe4e1',
              moccasin: 'ffe4b5',
              navajowhite: 'ffdead',
              navy: '000080',
              oldlace: 'fdf5e6',
              olive: '808000',
              olivedrab: '6b8e23',
              orange: 'ffa500',
              orangered: 'ff4500',
              orchid: 'da70d6',
              palegoldenrod: 'eee8aa',
              palegreen: '98fb98',
              paleturquoise: 'afeeee',
              palevioletred: 'db7093',
              papayawhip: 'ffefd5',
              peachpuff: 'ffdab9',
              peru: 'cd853f',
              pink: 'ffc0cb',
              plum: 'dda0dd',
              powderblue: 'b0e0e6',
              purple: '800080',
              rebeccapurple: '663399',
              red: 'f00',
              rosybrown: 'bc8f8f',
              royalblue: '4169e1',
              saddlebrown: '8b4513',
              salmon: 'fa8072',
              sandybrown: 'f4a460',
              seagreen: '2e8b57',
              seashell: 'fff5ee',
              sienna: 'a0522d',
              silver: 'c0c0c0',
              skyblue: '87ceeb',
              slateblue: '6a5acd',
              slategray: '708090',
              slategrey: '708090',
              snow: 'fffafa',
              springgreen: '00ff7f',
              steelblue: '4682b4',
              tan: 'd2b48c',
              teal: '008080',
              thistle: 'd8bfd8',
              tomato: 'ff6347',
              turquoise: '40e0d0',
              violet: 'ee82ee',
              wheat: 'f5deb3',
              white: 'fff',
              whitesmoke: 'f5f5f5',
              yellow: 'ff0',
              yellowgreen: '9acd32',
            }),
            N = (i.hexNames = j(k))
          function j(y) {
            var x = {}
            for (var m in y) y.hasOwnProperty(m) && (x[y[m]] = m)
            return x
          }
          function V(y) {
            return ((y = parseFloat(y)), (isNaN(y) || y < 0 || y > 1) && (y = 1), y)
          }
          function B(y, x) {
            Xr(y) && (y = '100%')
            var m = Ft(y)
            return (
              (y = Math.min(x, Math.max(0, parseFloat(y)))),
              m && (y = parseInt(y * x, 10) / 100),
              Math.abs(y - x) < 1e-6 ? 1 : (y % x) / parseFloat(x)
            )
          }
          function ce(y) {
            return Math.min(1, Math.max(0, y))
          }
          function Z(y) {
            return parseInt(y, 16)
          }
          function Xr(y) {
            return typeof y == 'string' && y.indexOf('.') != -1 && parseFloat(y) === 1
          }
          function Ft(y) {
            return typeof y == 'string' && y.indexOf('%') != -1
          }
          function ne(y) {
            return y.length == 1 ? '0' + y : '' + y
          }
          function qe(y) {
            return (y <= 1 && (y = y * 100 + '%'), y)
          }
          function Yr(y) {
            return Math.round(parseFloat(y) * 255).toString(16)
          }
          function Zr(y) {
            return Z(y) / 255
          }
          var ae = (function () {
            var y = '[-\\+]?\\d+%?',
              x = '[-\\+]?\\d*\\.\\d+%?',
              m = '(?:' + x + ')|(?:' + y + ')',
              O = '[\\s|\\(]+(' + m + ')[,|\\s]+(' + m + ')[,|\\s]+(' + m + ')\\s*\\)?',
              q =
                '[\\s|\\(]+(' +
                m +
                ')[,|\\s]+(' +
                m +
                ')[,|\\s]+(' +
                m +
                ')[,|\\s]+(' +
                m +
                ')\\s*\\)?'
            return {
              CSS_UNIT: new RegExp(m),
              rgb: new RegExp('rgb' + O),
              rgba: new RegExp('rgba' + q),
              hsl: new RegExp('hsl' + O),
              hsla: new RegExp('hsla' + q),
              hsv: new RegExp('hsv' + O),
              hsva: new RegExp('hsva' + q),
              hex3: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
              hex6: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
              hex4: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
              hex8: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
            }
          })()
          function he(y) {
            return !!ae.CSS_UNIT.exec(y)
          }
          function Ht(y) {
            y = y.replace(n, '').replace(a, '').toLowerCase()
            var x = !1
            if (k[y]) ((y = k[y]), (x = !0))
            else if (y == 'transparent') return {r: 0, g: 0, b: 0, a: 0, format: 'name'}
            var m
            return (m = ae.rgb.exec(y))
              ? {r: m[1], g: m[2], b: m[3]}
              : (m = ae.rgba.exec(y))
                ? {r: m[1], g: m[2], b: m[3], a: m[4]}
                : (m = ae.hsl.exec(y))
                  ? {h: m[1], s: m[2], l: m[3]}
                  : (m = ae.hsla.exec(y))
                    ? {h: m[1], s: m[2], l: m[3], a: m[4]}
                    : (m = ae.hsv.exec(y))
                      ? {h: m[1], s: m[2], v: m[3]}
                      : (m = ae.hsva.exec(y))
                        ? {h: m[1], s: m[2], v: m[3], a: m[4]}
                        : (m = ae.hex8.exec(y))
                          ? {
                              r: Z(m[1]),
                              g: Z(m[2]),
                              b: Z(m[3]),
                              a: Zr(m[4]),
                              format: x ? 'name' : 'hex8',
                            }
                          : (m = ae.hex6.exec(y))
                            ? {r: Z(m[1]), g: Z(m[2]), b: Z(m[3]), format: x ? 'name' : 'hex'}
                            : (m = ae.hex4.exec(y))
                              ? {
                                  r: Z(m[1] + '' + m[1]),
                                  g: Z(m[2] + '' + m[2]),
                                  b: Z(m[3] + '' + m[3]),
                                  a: Zr(m[4] + '' + m[4]),
                                  format: x ? 'name' : 'hex8',
                                }
                              : (m = ae.hex3.exec(y))
                                ? {
                                    r: Z(m[1] + '' + m[1]),
                                    g: Z(m[2] + '' + m[2]),
                                    b: Z(m[3] + '' + m[3]),
                                    format: x ? 'name' : 'hex',
                                  }
                                : !1
          }
          function Dt(y) {
            var x, m
            return (
              (y = y || {level: 'AA', size: 'small'}),
              (x = (y.level || 'AA').toUpperCase()),
              (m = (y.size || 'small').toLowerCase()),
              x !== 'AA' && x !== 'AAA' && (x = 'AA'),
              m !== 'small' && m !== 'large' && (m = 'small'),
              {level: x, size: m}
            )
          }
          return i
        })
      })(lt)),
    lt.exports
  )
}
var Kc
function lp() {
  if (Kc) return J
  ;((Kc = 1),
    Object.defineProperty(J, '__esModule', {value: !0}),
    (J.isvalidColorString =
      J.red =
      J.getContrastingColor =
      J.isValidHex =
      J.toState =
      J.simpleCheckForValidColor =
        void 0))
  var r = N1(),
    e = a(r),
    t = U1(),
    n = a(t)
  function a(o) {
    return o && o.__esModule ? o : {default: o}
  }
  J.simpleCheckForValidColor = function (s) {
    var u = ['r', 'g', 'b', 'a', 'h', 's', 'l', 'v'],
      l = 0,
      f = 0
    return (
      (0, e.default)(u, function (c) {
        if (s[c] && ((l += 1), isNaN(s[c]) || (f += 1), c === 's' || c === 'l')) {
          var h = /^\d+%$/
          h.test(s[c]) && (f += 1)
        }
      }),
      l === f ? s : !1
    )
  }
  var i = (J.toState = function (s, u) {
    var l = s.hex ? (0, n.default)(s.hex) : (0, n.default)(s),
      f = l.toHsl(),
      c = l.toHsv(),
      h = l.toRgb(),
      d = l.toHex()
    f.s === 0 && ((f.h = u || 0), (c.h = u || 0))
    var g = d === '000000' && h.a === 0
    return {
      hsl: f,
      hex: g ? 'transparent' : '#' + d,
      rgb: h,
      hsv: c,
      oldHue: s.h || u || f.h,
      source: s.source,
    }
  })
  return (
    (J.isValidHex = function (s) {
      if (s === 'transparent') return !0
      var u = String(s).charAt(0) === '#' ? 1 : 0
      return s.length !== 4 + u && s.length < 7 + u && (0, n.default)(s).isValid()
    }),
    (J.getContrastingColor = function (s) {
      if (!s) return '#fff'
      var u = i(s)
      if (u.hex === 'transparent') return 'rgba(0,0,0,0.4)'
      var l = (u.rgb.r * 299 + u.rgb.g * 587 + u.rgb.b * 114) / 1e3
      return l >= 128 ? '#000' : '#fff'
    }),
    (J.red = {
      hsl: {a: 1, h: 0, l: 0.5, s: 1},
      hex: '#ff0000',
      rgb: {r: 255, g: 0, b: 0, a: 1},
      hsv: {h: 0, s: 1, v: 1, a: 1},
    }),
    (J.isvalidColorString = function (s, u) {
      var l = s.replace('°', '')
      return (0, n.default)(u + ' (' + l + ')')._ok
    }),
    J
  )
}
var Vc
function z1() {
  if (Vc) return er
  ;((Vc = 1), Object.defineProperty(er, '__esModule', {value: !0}), (er.ColorWrap = void 0))
  var r =
      Object.assign ||
      function (g) {
        for (var v = 1; v < arguments.length; v++) {
          var b = arguments[v]
          for (var w in b) Object.prototype.hasOwnProperty.call(b, w) && (g[w] = b[w])
        }
        return g
      },
    e = (function () {
      function g(v, b) {
        for (var w = 0; w < b.length; w++) {
          var _ = b[w]
          ;((_.enumerable = _.enumerable || !1),
            (_.configurable = !0),
            'value' in _ && (_.writable = !0),
            Object.defineProperty(v, _.key, _))
        }
      }
      return function (v, b, w) {
        return (b && g(v.prototype, b), w && g(v, w), v)
      }
    })(),
    t = p,
    n = l(t),
    a = up(),
    i = l(a),
    o = lp(),
    s = u(o)
  function u(g) {
    if (g && g.__esModule) return g
    var v = {}
    if (g != null) for (var b in g) Object.prototype.hasOwnProperty.call(g, b) && (v[b] = g[b])
    return ((v.default = g), v)
  }
  function l(g) {
    return g && g.__esModule ? g : {default: g}
  }
  function f(g, v) {
    if (!(g instanceof v)) throw new TypeError('Cannot call a class as a function')
  }
  function c(g, v) {
    if (!g) throw new ReferenceError("this hasn't been initialised - super() hasn't been called")
    return v && (typeof v == 'object' || typeof v == 'function') ? v : g
  }
  function h(g, v) {
    if (typeof v != 'function' && v !== null)
      throw new TypeError('Super expression must either be null or a function, not ' + typeof v)
    ;((g.prototype = Object.create(v && v.prototype, {
      constructor: {value: g, enumerable: !1, writable: !0, configurable: !0},
    })),
      v && (Object.setPrototypeOf ? Object.setPrototypeOf(g, v) : (g.__proto__ = v)))
  }
  var d = (er.ColorWrap = function (v) {
    var b = (function (w) {
      h(_, w)
      function _(C) {
        f(this, _)
        var S = c(this, (_.__proto__ || Object.getPrototypeOf(_)).call(this))
        return (
          (S.handleChange = function (E, R) {
            var A = s.simpleCheckForValidColor(E)
            if (A) {
              var T = s.toState(E, E.h || S.state.oldHue)
              ;(S.setState(T),
                S.props.onChangeComplete && S.debounce(S.props.onChangeComplete, T, R),
                S.props.onChange && S.props.onChange(T, R))
            }
          }),
          (S.handleSwatchHover = function (E, R) {
            var A = s.simpleCheckForValidColor(E)
            if (A) {
              var T = s.toState(E, E.h || S.state.oldHue)
              S.props.onSwatchHover && S.props.onSwatchHover(T, R)
            }
          }),
          (S.state = r({}, s.toState(C.color, 0))),
          (S.debounce = (0, i.default)(function (E, R, A) {
            E(R, A)
          }, 100)),
          S
        )
      }
      return (
        e(
          _,
          [
            {
              key: 'render',
              value: function () {
                var S = {}
                return (
                  this.props.onSwatchHover && (S.onSwatchHover = this.handleSwatchHover),
                  n.default.createElement(
                    v,
                    r({}, this.props, this.state, {onChange: this.handleChange}, S),
                  )
                )
              },
            },
          ],
          [
            {
              key: 'getDerivedStateFromProps',
              value: function (S, E) {
                return r({}, s.toState(S.color, E.oldHue))
              },
            },
          ],
        ),
        _
      )
    })(t.PureComponent || t.Component)
    return (
      (b.propTypes = r({}, v.propTypes)),
      (b.defaultProps = r({}, v.defaultProps, {color: {h: 250, s: 0.5, l: 0.2, a: 1}})),
      b
    )
  })
  return ((er.default = d), er)
}
var rr = {},
  Ar = {},
  Xc
function W1() {
  if (Xc) return Ar
  ;((Xc = 1), Object.defineProperty(Ar, '__esModule', {value: !0}), (Ar.handleFocus = void 0))
  var r =
      Object.assign ||
      function (u) {
        for (var l = 1; l < arguments.length; l++) {
          var f = arguments[l]
          for (var c in f) Object.prototype.hasOwnProperty.call(f, c) && (u[c] = f[c])
        }
        return u
      },
    e = (function () {
      function u(l, f) {
        for (var c = 0; c < f.length; c++) {
          var h = f[c]
          ;((h.enumerable = h.enumerable || !1),
            (h.configurable = !0),
            'value' in h && (h.writable = !0),
            Object.defineProperty(l, h.key, h))
        }
      }
      return function (l, f, c) {
        return (f && u(l.prototype, f), c && u(l, c), l)
      }
    })(),
    t = p,
    n = a(t)
  function a(u) {
    return u && u.__esModule ? u : {default: u}
  }
  function i(u, l) {
    if (!(u instanceof l)) throw new TypeError('Cannot call a class as a function')
  }
  function o(u, l) {
    if (!u) throw new ReferenceError("this hasn't been initialised - super() hasn't been called")
    return l && (typeof l == 'object' || typeof l == 'function') ? l : u
  }
  function s(u, l) {
    if (typeof l != 'function' && l !== null)
      throw new TypeError('Super expression must either be null or a function, not ' + typeof l)
    ;((u.prototype = Object.create(l && l.prototype, {
      constructor: {value: u, enumerable: !1, writable: !0, configurable: !0},
    })),
      l && (Object.setPrototypeOf ? Object.setPrototypeOf(u, l) : (u.__proto__ = l)))
  }
  return (
    (Ar.handleFocus = function (l) {
      var f = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 'span'
      return (function (c) {
        s(h, c)
        function h() {
          var d, g, v, b
          i(this, h)
          for (var w = arguments.length, _ = Array(w), C = 0; C < w; C++) _[C] = arguments[C]
          return (
            (b =
              ((g =
                ((v = o(
                  this,
                  (d = h.__proto__ || Object.getPrototypeOf(h)).call.apply(d, [this].concat(_)),
                )),
                v)),
              (v.state = {focus: !1}),
              (v.handleFocus = function () {
                return v.setState({focus: !0})
              }),
              (v.handleBlur = function () {
                return v.setState({focus: !1})
              }),
              g)),
            o(v, b)
          )
        }
        return (
          e(h, [
            {
              key: 'render',
              value: function () {
                return n.default.createElement(
                  f,
                  {onFocus: this.handleFocus, onBlur: this.handleBlur},
                  n.default.createElement(l, r({}, this.props, this.state)),
                )
              },
            },
          ]),
          h
        )
      })(n.default.Component)
    }),
    Ar
  )
}
var Yc
function K1() {
  if (Yc) return rr
  ;((Yc = 1), Object.defineProperty(rr, '__esModule', {value: !0}), (rr.Swatch = void 0))
  var r =
      Object.assign ||
      function (c) {
        for (var h = 1; h < arguments.length; h++) {
          var d = arguments[h]
          for (var g in d) Object.prototype.hasOwnProperty.call(d, g) && (c[g] = d[g])
        }
        return c
      },
    e = p,
    t = u(e),
    n = Me(),
    a = u(n),
    i = W1(),
    o = cs(),
    s = u(o)
  function u(c) {
    return c && c.__esModule ? c : {default: c}
  }
  var l = 13,
    f = (rr.Swatch = function (h) {
      var d = h.color,
        g = h.style,
        v = h.onClick,
        b = v === void 0 ? function () {} : v,
        w = h.onHover,
        _ = h.title,
        C = _ === void 0 ? d : _,
        S = h.children,
        E = h.focus,
        R = h.focusStyle,
        A = R === void 0 ? {} : R,
        T = d === 'transparent',
        I = (0, a.default)({
          default: {
            swatch: r(
              {
                background: d,
                height: '100%',
                width: '100%',
                cursor: 'pointer',
                position: 'relative',
                outline: 'none',
              },
              g,
              E ? A : {},
            ),
          },
        }),
        D = function (B) {
          return b(d, B)
        },
        k = function (B) {
          return B.keyCode === l && b(d, B)
        },
        N = function (B) {
          return w(d, B)
        },
        j = {}
      return (
        w && (j.onMouseOver = N),
        t.default.createElement(
          'div',
          r({style: I.swatch, onClick: D, title: C, tabIndex: 0, onKeyDown: k}, j),
          S,
          T &&
            t.default.createElement(s.default, {
              borderRadius: I.swatch.borderRadius,
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
            }),
        )
      )
    })
  return ((rr.default = (0, i.handleFocus)(f)), rr)
}
var Zc
function V1() {
  return (
    Zc ||
      ((Zc = 1),
      (function (r) {
        Object.defineProperty(r, '__esModule', {value: !0})
        var e = g1()
        Object.defineProperty(r, 'Alpha', {
          enumerable: !0,
          get: function () {
            return l(e).default
          },
        })
        var t = cs()
        Object.defineProperty(r, 'Checkboard', {
          enumerable: !0,
          get: function () {
            return l(t).default
          },
        })
        var n = v1()
        Object.defineProperty(r, 'EditableInput', {
          enumerable: !0,
          get: function () {
            return l(n).default
          },
        })
        var a = y1()
        Object.defineProperty(r, 'Hue', {
          enumerable: !0,
          get: function () {
            return l(a).default
          },
        })
        var i = k1()
        Object.defineProperty(r, 'Raised', {
          enumerable: !0,
          get: function () {
            return l(i).default
          },
        })
        var o = j1()
        Object.defineProperty(r, 'Saturation', {
          enumerable: !0,
          get: function () {
            return l(o).default
          },
        })
        var s = z1()
        Object.defineProperty(r, 'ColorWrap', {
          enumerable: !0,
          get: function () {
            return l(s).default
          },
        })
        var u = K1()
        Object.defineProperty(r, 'Swatch', {
          enumerable: !0,
          get: function () {
            return l(u).default
          },
        })
        function l(f) {
          return f && f.__esModule ? f : {default: f}
        }
      })(Gi)),
    Gi
  )
}
var _e = V1(),
  X1 = lp()
const Y1 = $r(Hr).withConfig({
    displayName: 'ColorListWrap',
    componentId: 'sc-nrr1l2-0',
  })`gap:0.25em;`,
  Z1 = $r.div.withConfig({
    displayName: 'ColorBoxContainer',
    componentId: 'sc-nrr1l2-1',
  })`width:2.1em;height:2.1em;cursor:pointer;position:relative;overflow:hidden;border-radius:3px;background:url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAADFJREFUOE9jZGBgEGHAD97gk2YcNYBhmIQBgWSAP52AwoAQwJvQRg1gACckQoC2gQgAIF8IscwEtKYAAAAASUVORK5CYII=') left center #fff;`,
  J1 = $r.div.withConfig({
    displayName: 'ColorBox',
    componentId: 'sc-nrr1l2-2',
  })`border-radius:inherit;box-shadow:inset 0 0 0 1px var(--card-shadow-outline-color);content:'';position:absolute;inset:0;z-index:1;`,
  Q1 = (r) =>
    r.reduce((e, t) => {
      const n = t.hex ? F(t.hex) : F(t)
      return (n.isValid() && e.push({color: t, backgroundColor: n.toRgbString()}), e)
    }, [])
function ex(r) {
  const e = vt(7),
    {colors: t, onChange: n} = r
  if (!t) return null
  let a
  if (e[0] !== t || e[1] !== n) {
    let o
    ;(e[3] !== n
      ? ((o = (s, u) => {
          const {color: l, backgroundColor: f} = s
          return G(
            Z1,
            {
              onClick: () => {
                n(l)
              },
              children: G(J1, {style: {background: f}}),
            },
            `${f}-${u}`,
          )
        }),
        (e[3] = n),
        (e[4] = o))
      : (o = e[4]),
      (a = Q1(t).map(o)),
      (e[0] = t),
      (e[1] = n),
      (e[2] = a))
  } else a = e[2]
  let i
  return (
    e[5] !== a ? ((i = G(Y1, {wrap: 'wrap', children: a})), (e[5] = a), (e[6] = i)) : (i = e[6]),
    i
  )
}
const rx = (r) => {
    const e = vt(44),
      {onChange: t, rgb: n, hsl: a, hex: i, disableAlpha: o} = r,
      {sanity: s} = vp(),
      u = `inset 0 0 0 1px ${s.color.input.default.enabled.border}`,
      l = s.fonts.text.sizes[0]?.fontSize
    let f
    e[0] !== s.color.input.default.enabled.bg ||
    e[1] !== s.color.input.default.enabled.fg ||
    e[2] !== u ||
    e[3] !== l
      ? ((f = {
          width: '80%',
          padding: '4px 10% 3px',
          border: 'none',
          boxShadow: u,
          color: s.color.input.default.enabled.fg,
          backgroundColor: s.color.input.default.enabled.bg,
          fontSize: l,
          textAlign: 'center',
        }),
        (e[0] = s.color.input.default.enabled.bg),
        (e[1] = s.color.input.default.enabled.fg),
        (e[2] = u),
        (e[3] = l),
        (e[4] = f))
      : (f = e[4])
    const c = s.fonts.label.sizes[0]?.fontSize
    let h
    e[5] !== s.color.base.fg || e[6] !== c
      ? ((h = {
          display: 'block',
          textAlign: 'center',
          fontSize: c,
          color: s.color.base.fg,
          paddingTop: '3px',
          paddingBottom: '4px',
          textTransform: 'capitalize',
        }),
        (e[5] = s.color.base.fg),
        (e[6] = c),
        (e[7] = h))
      : (h = e[7])
    let d
    e[8] !== f || e[9] !== h
      ? ((d = {input: f, label: h}), (e[8] = f), (e[9] = h), (e[10] = d))
      : (d = e[10])
    const g = d
    let v
    e[11] !== a || e[12] !== t || e[13] !== n
      ? ((v = (k) => {
          if ('hex' in k && k.hex && X1.isValidHex(k.hex)) t({hex: k.hex, source: 'hex'})
          else if (n && (('r' in k && k.r) || ('g' in k && k.g) || ('b' in k && k.b)))
            t({
              r: Number(k.r) || n.r,
              g: Number(k.g) || n.g,
              b: Number(k.b) || n.b,
              a: n.a,
              source: 'rgb',
            })
          else if (a && 'a' in k && k.a) {
            let N = Number(k.a)
            ;(N < 0 ? (N = 0) : N > 100 && (N = 100),
              (N = N / 100),
              t({h: a.h, s: a.s, l: a.l, a: N, source: 'hsl'}))
          }
        }),
        (e[11] = a),
        (e[12] = t),
        (e[13] = n),
        (e[14] = v))
      : (v = e[14])
    const b = v
    let w
    e[15] !== i ? ((w = i?.replace('#', '')), (e[15] = i), (e[16] = w)) : (w = e[16])
    let _
    e[17] !== b || e[18] !== g || e[19] !== w
      ? ((_ = G(Oe, {
          flex: 2,
          marginRight: 1,
          children: G(_e.EditableInput, {style: g, label: 'hex', value: w, onChange: b}),
        })),
        (e[17] = b),
        (e[18] = g),
        (e[19] = w),
        (e[20] = _))
      : (_ = e[20])
    const C = n?.r
    let S
    e[21] !== b || e[22] !== g || e[23] !== C
      ? ((S = G(Oe, {
          flex: 1,
          marginRight: 1,
          children: G(_e.EditableInput, {
            style: g,
            label: 'r',
            value: C,
            onChange: b,
            dragLabel: !0,
            dragMax: 255,
          }),
        })),
        (e[21] = b),
        (e[22] = g),
        (e[23] = C),
        (e[24] = S))
      : (S = e[24])
    const E = n?.g
    let R
    e[25] !== b || e[26] !== g || e[27] !== E
      ? ((R = G(Oe, {
          flex: 1,
          marginRight: 1,
          children: G(_e.EditableInput, {
            style: g,
            label: 'g',
            value: E,
            onChange: b,
            dragLabel: !0,
            dragMax: 255,
          }),
        })),
        (e[25] = b),
        (e[26] = g),
        (e[27] = E),
        (e[28] = R))
      : (R = e[28])
    const A = n?.b
    let T
    e[29] !== b || e[30] !== g || e[31] !== A
      ? ((T = G(Oe, {
          flex: 1,
          marginRight: 1,
          children: G(_e.EditableInput, {
            style: g,
            label: 'b',
            value: A,
            onChange: b,
            dragLabel: !0,
            dragMax: 255,
          }),
        })),
        (e[29] = b),
        (e[30] = g),
        (e[31] = A),
        (e[32] = T))
      : (T = e[32])
    let I
    e[33] !== o || e[34] !== b || e[35] !== g || e[36] !== n?.a
      ? ((I =
          !o &&
          G(Oe, {
            flex: 1,
            children: G(_e.EditableInput, {
              style: g,
              label: 'a',
              value: Math.round((n?.a ?? 1) * 100),
              onChange: b,
              dragLabel: !0,
              dragMax: 100,
            }),
          })),
        (e[33] = o),
        (e[34] = b),
        (e[35] = g),
        (e[36] = n?.a),
        (e[37] = I))
      : (I = e[37])
    let D
    return (
      e[38] !== S || e[39] !== R || e[40] !== T || e[41] !== I || e[42] !== _
        ? ((D = be(Hr, {children: [_, S, R, T, I]})),
          (e[38] = S),
          (e[39] = R),
          (e[40] = T),
          (e[41] = I),
          (e[42] = _),
          (e[43] = D))
        : (D = e[43]),
      D
    )
  },
  tx = $r(Oe).withConfig({
    displayName: 'ColorBox',
    componentId: 'sc-13q7kbw-0',
  })`position:absolute;top:0;left:0;width:100%;height:100%;`,
  nx = $r(Hr).withConfig({
    displayName: 'ReadOnlyContainer',
    componentId: 'sc-13q7kbw-1',
  })`margin-top:6rem;background-color:var(--card-bg-color);position:relative;width:100%;`,
  ax = (r) => {
    const e = vt(47),
      {width: t, color: n, onChange: a, onUnset: i, disableAlpha: o, colorList: s, readOnly: u} = r,
      {rgb: l, hex: f, hsv: c, hsl: h} = n
    if (!h || !c) return null
    let d
    e[0] !== t ? ((d = {width: t}), (e[0] = t), (e[1] = d)) : (d = e[1])
    let g
    e[2] !== o || e[3] !== h || e[4] !== c || e[5] !== a || e[6] !== u || e[7] !== l
      ? ((g =
          !u &&
          be(Qc, {
            children: [
              G(Sr, {
                overflow: 'hidden',
                style: {position: 'relative', height: '5em'},
                children: G(_e.Saturation, {onChange: a, hsl: h, hsv: c}),
              }),
              G(Sr, {
                shadow: 1,
                radius: 3,
                overflow: 'hidden',
                style: {position: 'relative', height: '10px'},
                children: G(_e.Hue, {hsl: h, onChange: !u && a}),
              }),
              !o &&
                G(Sr, {
                  shadow: 1,
                  radius: 3,
                  overflow: 'hidden',
                  style: {position: 'relative', height: '10px', background: '#fff'},
                  children: G(_e.Alpha, {rgb: l, hsl: h, onChange: a}),
                }),
            ],
          })),
        (e[2] = o),
        (e[3] = h),
        (e[4] = c),
        (e[5] = a),
        (e[6] = u),
        (e[7] = l),
        (e[8] = g))
      : (g = e[8])
    let v
    e[9] === Symbol.for('react.memo_cache_sentinel')
      ? ((v = {position: 'relative', minWidth: '4em', background: '#fff'}), (e[9] = v))
      : (v = e[9])
    let b
    e[10] === Symbol.for('react.memo_cache_sentinel') ? ((b = {}), (e[10] = b)) : (b = e[10])
    let w
    e[11] === Symbol.for('react.memo_cache_sentinel')
      ? ((w = G(_e.Checkboard, {
          size: 8,
          white: 'transparent',
          grey: 'rgba(0,0,0,.08)',
          renderers: b,
        })),
        (e[11] = w))
      : (w = e[11])
    const _ = `rgba(${l?.r},${l?.g},${l?.b},${l?.a})`
    let C
    e[12] !== _
      ? ((C = G(tx, {style: {backgroundColor: _}})), (e[12] = _), (e[13] = C))
      : (C = e[13])
    let S
    e[14] !== f ||
    e[15] !== h?.h ||
    e[16] !== h?.l ||
    e[17] !== h?.s ||
    e[18] !== u ||
    e[19] !== l?.b ||
    e[20] !== l?.g ||
    e[21] !== l?.r
      ? ((S =
          u &&
          G(nx, {
            padding: 2,
            paddingBottom: 1,
            sizing: 'border',
            justify: 'space-between',
            children: be(vs, {
              space: 3,
              marginTop: 1,
              children: [
                G(Lt, {size: 3, weight: 'bold', children: f}),
                be(dp, {
                  space: 3,
                  children: [
                    be(Lt, {
                      size: 1,
                      children: [G('strong', {children: 'RGB: '}), l?.r, ' ', l?.g, ' ', l?.b],
                    }),
                    be(Lt, {
                      size: 1,
                      children: [
                        G('strong', {children: 'HSL: '}),
                        ' ',
                        Math.round(h?.h ?? 0),
                        ' ',
                        Math.round((h?.s ?? 0) * 100),
                        '% ',
                        Math.round((h?.l ?? 0) * 100),
                        '%',
                      ],
                    }),
                  ],
                }),
              ],
            }),
          })),
        (e[14] = f),
        (e[15] = h?.h),
        (e[16] = h?.l),
        (e[17] = h?.s),
        (e[18] = u),
        (e[19] = l?.b),
        (e[20] = l?.g),
        (e[21] = l?.r),
        (e[22] = S))
      : (S = e[22])
    let E
    e[23] !== C || e[24] !== S
      ? ((E = be(Sr, {flex: 1, radius: 2, overflow: 'hidden', style: v, children: [w, C, S]})),
        (e[23] = C),
        (e[24] = S),
        (e[25] = E))
      : (E = e[25])
    let R
    e[26] !== o ||
    e[27] !== f ||
    e[28] !== h ||
    e[29] !== a ||
    e[30] !== i ||
    e[31] !== u ||
    e[32] !== l
      ? ((R =
          !u &&
          be(Hr, {
            align: 'flex-start',
            marginLeft: 2,
            children: [
              G(Oe, {
                style: {width: 200},
                children: G(rx, {rgb: l, hsl: h, hex: f, onChange: a, disableAlpha: o}),
              }),
              G(Oe, {
                marginLeft: 2,
                children: G(eh, {onClick: i, title: 'Delete color', icon: gp, tone: 'critical'}),
              }),
            ],
          })),
        (e[26] = o),
        (e[27] = f),
        (e[28] = h),
        (e[29] = a),
        (e[30] = i),
        (e[31] = u),
        (e[32] = l),
        (e[33] = R))
      : (R = e[33])
    let A
    e[34] !== R || e[35] !== E
      ? ((A = be(Hr, {children: [E, R]})), (e[34] = R), (e[35] = E), (e[36] = A))
      : (A = e[36])
    let T
    e[37] !== s || e[38] !== a
      ? ((T = s && G(ex, {colors: s, onChange: a})), (e[37] = s), (e[38] = a), (e[39] = T))
      : (T = e[39])
    let I
    e[40] !== A || e[41] !== T || e[42] !== g
      ? ((I = G(Sr, {
          padding: 1,
          border: !0,
          radius: 1,
          children: be(vs, {space: 2, children: [g, A, T]}),
        })),
        (e[40] = A),
        (e[41] = T),
        (e[42] = g),
        (e[43] = I))
      : (I = e[43])
    let D
    return (
      e[44] !== d || e[45] !== I
        ? ((D = G('div', {style: d, children: I})), (e[44] = d), (e[45] = I), (e[46] = D))
        : (D = e[46]),
      D
    )
  },
  ix = Q(ax),
  Jc = {
    hex: '#24a3e3',
    hsl: {h: 200, s: 0.7732, l: 0.5156, a: 1},
    hsv: {h: 200, s: 0.8414, v: 0.8901, a: 1},
    rgb: {r: 46, g: 163, b: 227, a: 1},
    source: 'hex',
  }
function vx(r) {
  const e = vt(10),
    {onChange: t, readOnly: n} = r,
    a = r.value,
    [i, o] = yp(a),
    s = r.schemaType,
    u = mp(null)
  let l
  e[0] !== t || e[1] !== s
    ? ((l = function (h) {
        const d = s.fields
          .filter((g) => g.name in h)
          .map((g) => {
            const v = h[g.name],
              b = g.type.jsonType === 'object'
            return jt(b ? Object.assign({_type: g.type.name}, v) : v, [g.name])
          })
        t([_p({_type: s.name}), jt(s.name, ['_type']), jt(h.rgb?.a, ['alpha']), ...d])
      }),
      (e[0] = t),
      (e[1] = s),
      (e[2] = l))
    : (l = e[2])
  const f = l
  let c
  return (
    e[3] !== f || e[4] !== t || e[5] !== n || e[6] !== o || e[7] !== s || e[8] !== i
      ? ((c = G(Qc, {
          children:
            i && i.hex
              ? G(ix, {
                  color: i,
                  onChange: (h) =>
                    Bt(() => {
                      ;(o(h), f(h))
                    }),
                  readOnly: n || (typeof s.readOnly == 'boolean' && s.readOnly),
                  disableAlpha: !!s.options?.disableAlpha,
                  colorList: s.options?.colorList,
                  onUnset: () =>
                    Bt(() => {
                      ;(o(void 0), t(xp()))
                    }),
                })
              : G(eh, {
                  icon: pp,
                  mode: 'ghost',
                  text: 'Create color',
                  ref: u,
                  disabled: !!n,
                  onClick: () =>
                    Bt(() => {
                      ;(o(Jc), f(Jc))
                    }),
                }),
        })),
        (e[3] = f),
        (e[4] = t),
        (e[5] = n),
        (e[6] = o),
        (e[7] = s),
        (e[8] = i),
        (e[9] = c))
      : (c = e[9]),
    c
  )
}
export {vx as default}
